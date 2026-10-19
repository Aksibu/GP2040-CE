#include "addons/reverse.h"
#include "storagemanager.h"
#include "GamepadEnums.h"
#include "helper.h"
#include "config.pb.h"

bool ReverseInput::available() {
    const ReverseOptions& options = Storage::getInstance().getAddonOptions().reverseOptions;
	return options.enabled;
}

void ReverseInput::setup()
{
    // Setup Reverse Input Button
    mapInputReverse = new GamepadButtonMapping(0);

    GpioMappingInfo* pinMappings = Storage::getInstance().getProfilePinMappings();
    for (Pin_t pin = 0; pin < (Pin_t)NUM_BANK0_GPIOS; pin++)
    {
        switch (pinMappings[pin].action) {
            case GpioAction::BUTTON_PRESS_INPUT_REVERSE: mapInputReverse->pinMask |= Mask_t{1} << pin; break;
            default:    break;
        }
    }

    // Setup Reverse LED if available
    const ReverseOptions& options = Storage::getInstance().getAddonOptions().reverseOptions;
    pinLED = 0xff;
    if (isValidPin(options.ledPin)) {
        pinLED = options.ledPin;
        gpio_init(pinLED);
        gpio_set_dir(pinLED, GPIO_OUT);
        gpio_put(pinLED, 1);
    }

    actionUp = options.actionUp;
    actionDown = options.actionDown;
    actionLeft = options.actionLeft;
    actionRight = options.actionRight;
    buttonSwap = options.buttonSwap;

    Gamepad * gamepad = Storage::getInstance().GetGamepad();
    mapDpadUp    = gamepad->mapDpadUp;
    mapDpadDown  = gamepad->mapDpadDown;
    mapDpadLeft  = gamepad->mapDpadLeft;
    mapDpadRight = gamepad->mapDpadRight;
    mapButtonB1  = gamepad->mapButtonB1;
    mapButtonB2  = gamepad->mapButtonB2;
    mapButtonB3  = gamepad->mapButtonB3;
    mapButtonB4  = gamepad->mapButtonB4;

    invertXAxis = gamepad->getOptions().invertXAxis;
    invertYAxis = gamepad->getOptions().invertYAxis;

    state = false;
}

void ReverseInput::update() {
    Mask_t values = Storage::getInstance().GetGamepad()->debouncedGpio;

    state = (values & mapInputReverse->pinMask);
}
void ReverseInput::reinit() {
    delete mapInputReverse;
    setup();
}

uint8_t ReverseInput::input(uint32_t valueMask, uint16_t buttonMask, uint16_t buttonMaskReverse, uint8_t action, bool invertAxis) {
    if (state && action == 2) {
        return 0;
    }
    bool invert = (state && action == 1) ? !invertAxis : invertAxis;
    return (valueMask ? (invert ? buttonMaskReverse : buttonMask) : 0);
}

void ReverseInput::process()
{
    // Update Reverse State
    update();

    Gamepad * gamepad = Storage::getInstance().GetGamepad();

    gamepad->state.dpad = 0
        | input(gamepad->state.dpad & mapDpadUp->buttonMask,    mapDpadUp->buttonMask,      mapDpadDown->buttonMask,    actionUp,       invertYAxis)
        | input(gamepad->state.dpad & mapDpadDown->buttonMask,  mapDpadDown->buttonMask,    mapDpadUp->buttonMask,      actionDown,     invertYAxis)
        | input(gamepad->state.dpad & mapDpadLeft->buttonMask,  mapDpadLeft->buttonMask,    mapDpadRight->buttonMask,   actionLeft,     invertXAxis)
        | input(gamepad->state.dpad & mapDpadRight->buttonMask, mapDpadRight->buttonMask,   mapDpadLeft->buttonMask,    actionRight,    invertXAxis)
    ;

    if (state && buttonSwap) {
        uint16_t buttons = gamepad->state.buttons;
        uint16_t b1 = buttons & mapButtonB1->buttonMask;
        uint16_t b2 = buttons & mapButtonB2->buttonMask;
        uint16_t b3 = buttons & mapButtonB3->buttonMask;
        uint16_t b4 = buttons & mapButtonB4->buttonMask;

        buttons &= ~(mapButtonB1->buttonMask | mapButtonB2->buttonMask | mapButtonB3->buttonMask | mapButtonB4->buttonMask);

        if (b1) buttons |= mapButtonB2->buttonMask;
        if (b2) buttons |= mapButtonB1->buttonMask;
        if (b3) buttons |= mapButtonB4->buttonMask;
        if (b4) buttons |= mapButtonB3->buttonMask;

        gamepad->state.buttons = buttons;
    }

    if (pinLED != 0xff) {
        gpio_put(pinLED, !state);
    }
}

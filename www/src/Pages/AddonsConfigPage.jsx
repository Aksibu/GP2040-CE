import React, { useContext, useEffect, useState } from 'react';
import { Button, Form, Row, Col } from 'react-bootstrap';
import { Formik, useFormikContext } from 'formik';
import * as yup from 'yup';
import { Trans, useTranslation } from 'react-i18next';

import Section from '../Components/Section';
import WebApi from '../Services/WebApi';
import { AppContext } from '../Contexts/AppContext';

const schema = yup.object().shape({
	turboShotCount: yup
		.number()
		.label('Turbo Shot Count')
		.min(2)
		.max(30)
		.required(),
	turboShotCountB1: yup.number().min(0).max(30).nullable(),
	turboShotCountB2: yup.number().min(0).max(30).nullable(),
	turboShotCountB3: yup.number().min(0).max(30).nullable(),
	turboShotCountB4: yup.number().min(0).max(30).nullable(),
	turboShotCountL1: yup.number().min(0).max(30).nullable(),
	turboShotCountR1: yup.number().min(0).max(30).nullable(),
	turboShotCountL2: yup.number().min(0).max(30).nullable(),
	turboShotCountR2: yup.number().min(0).max(30).nullable(),
});

const defaultValues = {
	turboShotCount: 15,
	turboShotCountB1: '',
	turboShotCountB2: '',
	turboShotCountB3: '',
	turboShotCountB4: '',
	turboShotCountL1: '',
	turboShotCountR1: '',
	turboShotCountL2: '',
	turboShotCountR2: '',
	TurboInputEnabled: 0,
};

export default function AddonsConfigPage() {
	const { setLoading } = useContext(AppContext);
	const [saveMessage, setSaveMessage] = useState('');
	const { t } = useTranslation();

	return (
		<Formik
			validationSchema={schema}
			onSubmit={async (values) => {
				const sanitizedValues = { ...values };
				const buttons = ['B1', 'B2', 'B3', 'B4', 'L1', 'R1', 'L2', 'R2'];
				buttons.forEach((btn) => {
					const key = `turboShotCount${btn}`;
					if (sanitizedValues[key] === '' || sanitizedValues[key] === null || sanitizedValues[key] === undefined) {
						sanitizedValues[key] = 0;
					} else {
						sanitizedValues[key] = parseInt(sanitizedValues[key], 10);
					}
				});
				const success = await WebApi.setAddonsOptions(sanitizedValues);
				if (success) {
					setSaveMessage(t('Common:saved-success-message'));
				} else {
					setSaveMessage(t('Common:saved-error-message'));
				}
			}}
			initialValues={defaultValues}
		>
			{({
				handleSubmit,
				values,
				errors,
				setValues,
				handleChange,
				handleBlur,
			}) => {
				useEffect(() => {
					async function fetchData() {
						const data = await WebApi.getAddonsOptions(setLoading);
						if (data) {
							const formattedData = { ...data };
							const buttons = ['B1', 'B2', 'B3', 'B4', 'L1', 'R1', 'L2', 'R2'];
							buttons.forEach((btn) => {
								const key = `turboShotCount${btn}`;
								if (!formattedData[key] || formattedData[key] === 0) {
									formattedData[key] = '';
								}
							});
							setValues(formattedData);
						}
					}
					fetchData();
				}, []);

				return (
					<Form noValidate onSubmit={handleSubmit}>
						<Section title={t('AddonsConfig:turbo-header-text')}>
							<Row className="mb-3">
								<Form.Group as={Col} md="3">
									<Form.Label>{t('AddonsConfig:turbo-shot-count-label')}</Form.Label>
									<Form.Control
										type="number"
										name="turboShotCount"
										value={values.turboShotCount}
										onChange={handleChange}
										onBlur={handleBlur}
										isInvalid={!!errors.turboShotCount}
										min={2}
										max={30}
									/>
									<Form.Control.Feedback type="invalid">
										{errors.turboShotCount}
									</Form.Control.Feedback>
								</Form.Group>
							</Row>

							<Row className="mb-3">
								<h5>{t('AddonsConfig:turbo-button-rates-label', 'Per-Button Turbo Rates (2-30, blank for default)')}</h5>
								{['B1', 'B2', 'B3', 'B4', 'L1', 'R1', 'L2', 'R2'].map((btn) => (
									<Form.Group as={Col} md="3" key={btn} className="mb-2">
										<Form.Label>{btn}</Form.Label>
										<Form.Control
											type="number"
											name={`turboShotCount${btn}`}
											value={values[`turboShotCount${btn}`] ?? ''}
											onChange={handleChange}
											onBlur={handleBlur}
											min={2}
											max={30}
											placeholder={values.turboShotCount?.toString()}
										/>
									</Form.Group>
								))}
							</Row>
						</Section>

						<Button type="submit">{t('Common:button-save-label')}</Button>
						{saveMessage && <div className="mt-3">{saveMessage}</div>}
					</Form>
				);
			}}
		</Formik>
	);
}
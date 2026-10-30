import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

import { baseUrlExpression } from '../nodes/TextBee/shared/baseUrl';

export class TextBeeApi implements ICredentialType {
	name = 'textBeeApi';

	displayName = 'TextBee API';

	icon: Icon = { light: 'file:../icons/sms.svg', dark: 'file:../icons/sms.dark.svg' };

	documentationUrl = 'https://textbee.dev/docs/getting-started/api-keys';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'API key from the TextBee dashboard',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.textbee.dev',
			placeholder: 'https://api.textbee.dev',
			description:
				'TextBee API host. Defaults to the hosted service. Change for self-hosted instances. The `/api/v1` suffix is optional and added automatically.',
		},
		{
			displayName: 'Webhook Signing Secret',
			name: 'webhookSigningSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'Shared secret (at least 20 characters) used to sign and verify webhook deliveries. Required when using the TextBee Trigger node.',
			hint: 'Only required when using the TextBee Trigger node',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-api-key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: baseUrlExpression,
			url: '/gateway/stats',
			method: 'GET',
		},
	};
}

import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IWebhookFunctions,
} from 'n8n-workflow';

import { normalizeBaseUrl } from './baseUrl';

type TextBeeContext =
	| IHookFunctions
	| IExecuteFunctions
	| ILoadOptionsFunctions
	| IWebhookFunctions;

export async function textBeeApiRequest(
	this: TextBeeContext,
	method: IHttpRequestMethods,
	resource: string,
	body: IDataObject | undefined = undefined,
	qs: IDataObject = {},
) {
	const credentials = await this.getCredentials('textBeeApi');
	const baseURL = normalizeBaseUrl(credentials.baseUrl as string);

	const options: IHttpRequestOptions = {
		method,
		qs,
		body,
		baseURL,
		url: resource,
		json: true,
	};

	return this.helpers.httpRequestWithAuthentication.call(this, 'textBeeApi', options);
}

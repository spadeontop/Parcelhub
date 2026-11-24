import React from 'react';
import { SAMPLE_PROOF_IMAGES, SAMPLE_RECEIPT_IMAGES } from '../endpoints';
import { OrderStatusBadge } from './MethodBadge';
import type {
  EndpointFieldSpec,
  OrderStatus,
  PostmanEndpointSpec,
  PostmanFormKey,
  PostmanFormState,
} from '../types';

export interface RequestFormFieldsProps {
  readonly spec: PostmanEndpointSpec;
  readonly form: PostmanFormState;
  readonly onChangeField: (key: PostmanFormKey, value: string) => void;
  readonly matchedOrderStatus?: OrderStatus;
}

const SECTION_LABELS: Record<EndpointFieldSpec['section'], string> = {
  path: 'Path Parameters',
  query: 'Query Parameters',
  body: 'Body Fields',
};

export const RequestFormFields: React.FC<RequestFormFieldsProps> = ({
  spec,
  form,
  onChangeField,
  matchedOrderStatus,
}) => {
  if (spec.fields.length === 0) {
    return (
      <div className="py-4 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
        No parameters required for this endpoint.
      </div>
    );
  }

  const sections: Array<EndpointFieldSpec['section']> = ['path', 'query', 'body'];

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const fields = spec.fields.filter((f) => f.section === section);
        if (fields.length === 0) return null;

        return (
          <div key={section} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {SECTION_LABELS[section]}
              </span>
              {section === 'path' && matchedOrderStatus && (
                <OrderStatusBadge status={matchedOrderStatus} />
              )}
              {section === 'body' && spec.id === 'customer_register' && (
                <button
                  type="button"
                  onClick={() =>
                    onChangeField('email', `test.${Date.now().toString().slice(-5)}@example.com`)
                  }
                  className="text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 rounded px-1.5 py-0.5 bg-white dark:bg-zinc-900 cursor-pointer"
                >
                  + Unique Email
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {fields.map((field) => {
                const inputId = `pm-field-${spec.id}-${field.key}`;
                const value = form[field.key];
                const isWide =
                  field.key === 'initImageUrl' ||
                  field.key === 'proofImageUrl' ||
                  field.key === 'preAuthToken' ||
                  field.key === 'refreshToken' ||
                  field.key === 'resetToken' ||
                  field.key === 'fcmToken' ||
                  field.key === 'reason';

                return (
                  <div key={field.key} className={isWide ? 'sm:col-span-2 lg:col-span-3' : ''}>
                    <label
                      htmlFor={inputId}
                      className="block text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-1"
                    >
                      {field.label}
                      {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                    </label>

                    {field.kind === 'select' && field.options ? (
                      <select
                        id={inputId}
                        value={value}
                        onChange={(e) => onChangeField(field.key, e.target.value)}
                        className="w-full px-2 py-1.5 text-xs font-mono bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                      >
                        {field.options.map((opt) => (
                          <option
                            key={opt || 'empty'}
                            value={opt}
                            className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                          >
                            {opt || '(none)'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={inputId}
                        type={field.kind === 'number' ? 'number' : field.kind === 'email' ? 'email' : 'text'}
                        maxLength={field.maxLength}
                        placeholder={field.placeholder}
                        value={value}
                        onChange={(e) => onChangeField(field.key, e.target.value)}
                        className={`w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100 ${
                          field.mono ? 'font-mono' : ''
                        }`}
                      />
                    )}

                    {/* Quick image presets */}
                    {field.key === 'initImageUrl' && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {SAMPLE_RECEIPT_IMAGES.map((sample) => (
                          <button
                            key={sample.url}
                            type="button"
                            onClick={() => onChangeField('initImageUrl', sample.url)}
                            className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${
                              form.initImageUrl === sample.url
                                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'
                            }`}
                          >
                            {sample.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {field.key === 'proofImageUrl' && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {SAMPLE_PROOF_IMAGES.map((sample) => (
                          <button
                            key={sample.url}
                            type="button"
                            onClick={() => onChangeField('proofImageUrl', sample.url)}
                            className={`px-2 py-0.5 text-[10px] rounded border cursor-pointer ${
                              form.proofImageUrl === sample.url
                                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950'
                                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'
                            }`}
                          >
                            {sample.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

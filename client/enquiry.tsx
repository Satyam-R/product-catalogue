import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { EnquiryInput, Product } from '../shared/contracts';
import { errorMessage, RequestError, sendEnquiry } from './api';

type FormState =
  | { status: 'ready' | 'sending' | 'sent' }
  | { status: 'error'; message: string; fields?: Partial<EnquiryInput> };

export function Enquiry({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<EnquiryInput>({ name: '', email: '' });
  const [state, setState] = useState<FormState>({ status: 'ready' });
  const nameInput = useRef<HTMLInputElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const sending = useRef(false);

  useEffect(() => {
    if (open) nameInput.current?.focus();
  }, [open]);

  useEffect(() => {
    if (state.status === 'sent') confirmation.current?.focus();
  }, [state.status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || state.status === 'sent') return;

    sending.current = true;
    setState({ status: 'sending' });
    try {
      await sendEnquiry(product.id, details);
      setState({ status: 'sent' });
    } catch (error) {
      setState({
        status: 'error',
        message: errorMessage(error, 'We could not send your enquiry. Please try again.'),
        fields: error instanceof RequestError ? error.fields : undefined,
      });
    } finally {
      sending.current = false;
    }
  }

  if (state.status === 'sent') {
    return (
      <div className="confirmation" role="status" tabIndex={-1} ref={confirmation}>
        <h2>Thank you</h2>
        <p>Your enquiry has been sent to our sales team.</p>
      </div>
    );
  }

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)}>Enquire</button>;
  }

  const fields = state.status === 'error' ? state.fields : undefined;
  const disabled = state.status === 'sending';

  return (
    <form className="enquiry-form" aria-labelledby="enquiry-title" onSubmit={handleSubmit}>
      <h2 id="enquiry-title">Send an enquiry</h2>
      {state.status === 'error' && <p className="form-error" role="alert">{state.message}</p>}
      <label htmlFor="enquiry-name">Name</label>
      <input
        id="enquiry-name"
        ref={nameInput}
        autoComplete="name"
        name="name"
        required
        maxLength={100}
        value={details.name}
        disabled={disabled}
        aria-invalid={!!fields?.name}
        aria-describedby={fields?.name ? 'name-error' : undefined}
        onChange={(event) => setDetails({ ...details, name: event.target.value })}
      />
      {fields?.name && <p className="field-error" id="name-error">{fields.name}</p>}
      <label htmlFor="enquiry-email">Email</label>
      <input
        id="enquiry-email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
        value={details.email}
        disabled={disabled}
        aria-invalid={!!fields?.email}
        aria-describedby={fields?.email ? 'email-error' : undefined}
        onChange={(event) => setDetails({ ...details, email: event.target.value })}
      />
      {fields?.email && <p className="field-error" id="email-error">{fields.email}</p>}
      <button type="submit" disabled={disabled}>{disabled ? 'Sending…' : 'Submit enquiry'}</button>
    </form>
  );
}

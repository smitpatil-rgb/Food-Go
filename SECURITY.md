# Security

This application starter has not undergone an independent security audit. Passing tests is not a production-readiness guarantee.

## Reporting

Use GitHub's private vulnerability reporting feature if enabled by the owner, or a private contact channel the owner publishes. Never include secrets, customer information, session tokens, database URLs, or exploit details in a public issue.

## Deployment checklist

- Keep credentials, `.env`, private keys, and backups out of version control.
- Set a unique random signing secret, choose a strong staff password, and use HTTPS.
- Never publicly deploy `FOODGO_DATA_MODE=memory`. This local demo/test adapter has temporary storage and test-only credential fallbacks.
- Never point E2E tests at a live database; they create and change records.
- The included Docker credentials are only for a loopback-bound development database.
- Arrange protected backups, monitoring, dependency updates, and shared atomic rate limiting before horizontal scaling.
- Review staff role-specific authorization and immediate session revocation before multi-role production use.
- Obtain independent security review before processing real customer information.

This app does not collect payment-card details. Payments are cash or UPI on delivery, without gateway integration.

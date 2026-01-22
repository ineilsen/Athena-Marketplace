# Athena Marketplace

Quick links to the two demos in this repository:

- [Agentic Unified Desktop](Agentic%20Unified%20Desktop/README.md)
- [Vodafone Marketplace Demo](Vodafone%20Marketplace%20Demo/README.md)

## Microsoft 365 (Graph) credentials

The Agentic Unified Desktop can execute Microsoft 365 admin actions (create user, disable/delete user, assign licenses, check assignments) via Microsoft Graph using an Entra ID app registration (client credentials flow).

### 1) Create an app registration (Entra ID)
- Azure Portal → Microsoft Entra ID → App registrations → New registration
- Name: e.g. `athena-m365-admin`
- Supported account types: “Accounts in this organizational directory only”
- Register

### 2) Create a client secret
- App registration → Certificates & secrets → New client secret
- Copy the *secret value* (not the secret ID). Store it securely.

### 3) Add Microsoft Graph Application permissions
- App registration → API permissions → Add a permission → Microsoft Graph → Application permissions
- Minimum typically needed for the flows in this repo:
	- `Organization.Read.All` (seat/subscribed SKU queries)
	- `User.ReadWrite.All` (create/update/disable/delete users, assign licenses)
	- `Directory.ReadWrite.All` (some tenant/user directory operations)
- Click “Grant admin consent” for the tenant.

If you see `403` / `insufficient privileges` during execution, it usually means the permission set or admin consent is incomplete.

### 4) Configure `Agentic Unified Desktop/.env`

Set:
- `AZURE_TENANT_DOMAIN` (e.g. `crmBc395940.onmicrosoft.com`)
- `AZURE_CLIENT_ID` (App registration → Overview → Application (client) ID)
- `AZURE_CLIENT_SECRET` (the secret value from step 2)

Security note: never commit real tenant credentials or secrets.

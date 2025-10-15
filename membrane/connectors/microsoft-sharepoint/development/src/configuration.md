## Creating Test/Developer account

An Azure account that has an active subscription.

- [Create an account for free](https://azure.microsoft.com/free/?WT.mc_id=A261C142F).
- The Azure account must have permission to manage applications in Microsoft Entra ID. Any of the following Microsoft Entra roles include the required permissions:
  - [Application administrator](https://learn.microsoft.com/en-us/azure/active-directory/roles/permissions-reference?toc=/graph/toc.json#application-administrator)
  - [Application developer](https://learn.microsoft.com/en-us/azure/active-directory/roles/permissions-reference?toc=/graph/toc.json#application-developer)
  - [Cloud application administrator](https://learn.microsoft.com/en-us/azure/active-directory/roles/permissions-reference?toc=/graph/toc.json#cloud-application-administrator)
- Completion of the [Set up a tenant](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-create-new-tenant) quickstart.

## Creating OAuth Application

Full article: [Register an application with the Microsoft identity platform](https://learn.microsoft.com/en-us/graph/auth-register-app-v2?context=graph%2Fapi%2F1.0&view=graph-rest-1.0) .

First of all you will need to have an MS Azure account. ([See more...](https://azure.microsoft.com/free/?WT.mc_id=A261C142F))

Quick step-by-step guide:

1. Sign in to the [Microsoft Entra admin center](https://entra.microsoft.com/).
2. Expand the **Identity** menu > expand **Applications** > select **App registrations** > New registration.
3. Enter a display **Name** for your application.
4. Specify who can use the application - you may want to set it to `Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)` to make sure your customers from multiple organizations and those having personal accounts can log in.
5. Add the following **Redirect URI**: https://api.integration.app/oauth-callback
6. Select **Register** to complete the initial app registration.

![Register App image](https://static.integration.app/connectors/microsoft-sharepoint/microsoft_app_registration.png)

> When registration finishes, the Microsoft Entra admin center displays the app registration's Overview pane. You'll see the **Application (client) ID** there - save it somewhere.

- Under **Manage**, select **Authentication**.
- Under **Platform** configurations, select **Add a platform**.
- Under **Configure platforms**, select **Web**.
- Select **Configure** to complete the platform configuration.

7. Add credentials:

- Under **Manage**, select **Certificates & secrets** > **Client secrets** > **New client secret**.
- Select an expiration for the secret or specify a custom lifetime.
- Select **Add**.
- **Save the secret's value** for use in your client application code. This secret value is **NEVER displayed** again after you leave this page.

8. Configure API permission:

- Under **Manage**, select **API permissions** > select **Add API permissions**.
- Select **Microsoft Graph** > select **Delegated**.
- Enter the necessary permissions for your app and select **Add permissions**:
  - offline_access
  - Files.ReadWrite.All
  - User.Read
  - User.Read.All
  - Sites.Search.All
  - Sites.ReadWrite.All

## Configure the app parameters in the integration.app platform

- Add the Microsoft Sharepoint app from store in the Integration.app [console](https://console.integration.app/)
- Click **Configure & Test**
- In the **Parameters** section, select a **Use custom parameters** toggle / **Edit Parameters**
- Put the the Application (client) ID into **Client Id** and the app secret into the **Client Secret**
- Add scopes your application requires to be functional

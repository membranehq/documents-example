## Get a Developer account

To be able to create your own Box application, you'll need to either sign up for a free-tier Box account (this can be done from the main page at [box.com](https://www.box.com/)) or sign up for an [Enterprise Developer account](https://support.box.com/hc/en-us/articles/4636662134803-Creating-Your-Developer-Account) should you already be paying for a Box account.

## Create an oauth app

A step-by-step guide on how to create a Box application here: [https://support.box.com/hc/en-us/articles/4636617907731-Creating-Your-First-Application](https://support.box.com/hc/en-us/articles/4636617907731-Creating-Your-First-Application).

Once you've got your Box account, you'll need to create an oauth app. This can be done from the Box Developer Console [here](https://app.box.com/developers/console). The following pieces of information needs to be filled in before you can move on:

- application type: **Custom App**
- authentication method: **User Authentication (OAuth 2.0)**
- a name for your custom app

## Get OAuth credentials

Once you've hit **Create App** you can further customize your application from the **Configuration** tab. To ensure the flawlessness of the integration with the `box-connector`, you need to:

- copy and save somewhere safe **Client ID** and **Client Secret** values of **OAuth 2.0 Credentials**
- set `https://api.integration.app/oauth-callback` as the **OAuth 2.0 Redirect URI**
- select `Manage Webhooks`, `Read all files and folders` and `Write all files and folders` **Application Scopes**

## Configure the app parameters in the integration.app platform

- Add the **Box** app from store in the Integration.app [console](https://console.integration.app/)
- Click **Configure & Test**
- Select **Parameters** / **Edit Parameters**
- Fill in the **Client Id** and the **Client Secret** values (you should've saved them earlier)
- Click **Save**

## Configure Webhooks

Box offers a mechanism of subscription to changes that occur with user's content (files/folders). To be able to receive events with these changes, you may want to create an application webhook like so:

- go to the integration.app [console](https://console.integration.app/) => External Apps => Box => Configure & Test and copy the **Global Webhooks** url <img height="135" width="671" alt="global webhooks" src="https://static.integration.app/connectors/box/asset-b9816d39-61ff-4eb0-b51e-bf4f5f844ed6.png" />
- from the Box developers console, go to **Webhooks/V1 Webhooks**
- click Create Webhook and choose V1 from the dropdown list
- check `Created`, `Uploaded`, `Deleted` event types in the **Event Triggers** section
- paste the Global Webhooks url you saved earlier into the **Endpoint URL** field and select **REST** as a payload format
- add the following Callback Parameters <img height="506" width="558" alt="callback parameters" src="https://static.integration.app/connectors/box/asset-b5a48b3f-ea61-40a9-97e1-1242b4d93a9a.png" />
- save the webhook

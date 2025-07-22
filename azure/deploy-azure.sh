#!/bin/bash

# Azure Deployment Script for MCP Workflow Server
# Prerequisites: Azure CLI installed and logged in

set -e

# Configuration
RESOURCE_GROUP="mcp-workflow-rg"
LOCATION="eastus"
APP_NAME="mcp-workflow-server"
ACR_NAME="mcpworkflowacr"
SKU="B2" # Basic tier, adjust as needed
IMAGE_TAG="latest"

echo "🚀 Starting Azure deployment for MCP Workflow Server"

# 1. Create Resource Group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 2. Create Azure Container Registry
echo "🏗️ Creating container registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# 3. Build and push Docker image
echo "🔨 Building Docker image..."
az acr build \
  --registry $ACR_NAME \
  --resource-group $RESOURCE_GROUP \
  --image mcp-workflow-server:$IMAGE_TAG \
  --file azure/Dockerfile.azure \
  .

# 4. Create App Service Plan
echo "📋 Creating App Service plan..."
az appservice plan create \
  --name "${APP_NAME}-plan" \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --is-linux \
  --sku $SKU

# 5. Create Web App
echo "🌐 Creating Web App..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan "${APP_NAME}-plan" \
  --name $APP_NAME \
  --deployment-container-image-name "$ACR_NAME.azurecr.io/mcp-workflow-server:$IMAGE_TAG"

# 6. Configure Web App settings
echo "⚙️ Configuring Web App..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings \
    WEBSITES_PORT=8080 \
    NODE_ENV=production \
    LOG_LEVEL=info \
    DOCKER_ENABLE_CI=true

# 7. Configure container settings
echo "🐳 Configuring container settings..."
az webapp config container set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-custom-image-name "$ACR_NAME.azurecr.io/mcp-workflow-server:$IMAGE_TAG" \
  --docker-registry-server-url "https://$ACR_NAME.azurecr.io" \
  --docker-registry-server-user $(az acr credential show --name $ACR_NAME --query username -o tsv) \
  --docker-registry-server-password $(az acr credential show --name $ACR_NAME --query passwords[0].value -o tsv)

# 8. Enable continuous deployment
echo "🔄 Enabling continuous deployment..."
az webapp deployment container config \
  --enable-cd true \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP

# 9. Configure logging
echo "📊 Configuring logging..."
az webapp log config \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --docker-container-logging filesystem \
  --level verbose

# 10. Set up Application Insights (optional)
echo "📈 Setting up Application Insights..."
az monitor app-insights component create \
  --app $APP_NAME \
  --location $LOCATION \
  --resource-group $RESOURCE_GROUP \
  --application-type Node.JS

# Get the instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query instrumentationKey -o tsv)

# Set Application Insights key
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $APP_NAME \
  --settings APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY

# 11. Configure auto-scaling (optional)
echo "📏 Configuring auto-scaling..."
az monitor autoscale create \
  --resource-group $RESOURCE_GROUP \
  --resource $APP_NAME \
  --resource-type Microsoft.Web/serverfarms \
  --name "${APP_NAME}-autoscale" \
  --min-count 1 \
  --max-count 4 \
  --count 1

# Add CPU-based scaling rule
az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name "${APP_NAME}-autoscale" \
  --condition "Percentage CPU > 70 avg 5m" \
  --scale out 1

az monitor autoscale rule create \
  --resource-group $RESOURCE_GROUP \
  --autoscale-name "${APP_NAME}-autoscale" \
  --condition "Percentage CPU < 30 avg 5m" \
  --scale in 1

# 12. Output deployment information
echo "✅ Deployment complete!"
echo ""
echo "📌 Deployment Information:"
echo "   Web App URL: https://$APP_NAME.azurewebsites.net"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Container Registry: $ACR_NAME.azurecr.io"
echo ""
echo "📝 Next steps:"
echo "   1. Update your DNS to point to the Azure Web App"
echo "   2. Configure custom domain and SSL certificate"
echo "   3. Set up Azure Key Vault for secrets"
echo "   4. Configure backup and disaster recovery"
echo ""
echo "🔍 View logs:"
echo "   az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
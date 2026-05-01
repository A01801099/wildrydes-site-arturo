# 🦄 Wild Rydes — Serverless Web App

Tutorial de AWS: Lambda + API Gateway + Cognito + DynamoDB  
Frontend corre **local**. Backend en **AWS**.

---

## 📁 Estructura del proyecto

```
wildrydes/
├── index.html          ← Landing page
├── register.html       ← Registro de usuario
├── verify.html         ← Verificación de email
├── signin.html         ← Login
├── ride.html           ← Mapa para pedir unicornio
├── css/
│   └── style.css
├── js/
│   ├── config.js       ← ⚠️ EDITAR con tus credenciales AWS
│   ├── cognito-auth.js ← Lógica de autenticación
│   └── ride.js         ← Lógica del mapa y API calls
└── lambda/
    └── index.js        ← Código de la función Lambda
```

---

## 🚀 Pasos para configurar

### MÓDULO 2 — Amazon Cognito

1. Ir a AWS Console → **Amazon Cognito** → Create User Pool
2. Configuración:
   - Sign-in: **Email**
   - MFA: **No MFA**
   - Self-registration: **Enabled**
   - Email: **Send email with Cognito**
   - User pool name: `WildRydes`
   - App client name: `WildRydesWebApp`
   - **No marcar "Generate client secret"**
3. Anotar:
   - `User Pool ID` → algo como `us-east-1_xxxxxxxx`
   - `App Client ID` → string largo

4. Editar `js/config.js`:
```js
window._config = {
    cognito: {
        userPoolId: 'us-east-1_XXXXXXXXX',
        userPoolClientId: 'XXXXXXXXXXXXXXXXXXXX',
        region: 'us-east-1'
    },
    api: {
        invokeUrl: ''  // llenar después del módulo 4
    }
};
```

---

### MÓDULO 3 — DynamoDB + Lambda

#### DynamoDB
1. AWS Console → **DynamoDB** → Create Table
   - Table name: `Rides`
   - Partition key: `RideId` (String)
   - Dejar defaults → Create
2. Anotar el **ARN** de la tabla (Overview → Additional info)

#### IAM Role
1. AWS Console → **IAM** → Roles → Create Role
   - Trusted entity: **AWS Service → Lambda**
   - Attach policy: `AWSLambdaBasicExecutionRole`
   - Role name: `WildRydesLambda`
2. Abrir el rol creado → Add permissions → Create inline policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["dynamodb:PutItem"],
            "Resource": "arn:aws:dynamodb:REGION:ACCOUNT:table/Rides"
        }
    ]
}
```

#### Lambda
1. AWS Console → **Lambda** → Create Function
   - Name: `RequestUnicorn`
   - Runtime: **Node.js 18.x** (o 20.x)
   - Execution role: **Use existing → WildRydesLambda**
2. En el editor de código, reemplazar con el contenido de `lambda/index.js`
3. Deploy
4. **Test** con este JSON:
```json
{
    "path": "/ride",
    "httpMethod": "POST",
    "headers": {
        "Accept": "*/*",
        "Authorization": "eyJraWQiOiJLTzRVMWZs...",
        "content-type": "application/json; charset=UTF-8"
    },
    "queryStringParameters": null,
    "pathParameters": null,
    "requestContext": {
        "authorizer": {
            "claims": {
                "cognito:username": "the_username"
            }
        }
    },
    "body": "{\"PickupLocation\":{\"Latitude\":47.6174755835663,\"Longitude\":-122.28837066650185}}"
}
```

---

### MÓDULO 4 — API Gateway

1. AWS Console → **API Gateway** → Create API → **REST API**
   - API name: `WildRydes`
   - Endpoint: Regional

2. **Crear Authorizer**:
   - Authorizers → Create → **Cognito**
   - Name: `WildRydes`
   - User Pool: seleccionar `WildRydes`
   - Token Source: `Authorization`
   - Test con un JWT de Cognito para verificar

3. **Crear recurso y método**:
   - Actions → Create Resource → `/ride`
   - Actions → Create Method → **POST**
   - Integration type: Lambda Function
   - Lambda: `RequestUnicorn`
   - Method Request → Authorization: `WildRydes`

4. **Habilitar CORS**:
   - Seleccionar `/ride` → Actions → **Enable CORS**
   - Deploy

5. **Deploy**:
   - Actions → Deploy API
   - Stage: `prod`
   - Copiar el **Invoke URL**

6. Pegar el Invoke URL en `js/config.js`:
```js
api: {
    invokeUrl: 'https://XXXXXXXX.execute-api.us-east-1.amazonaws.com/prod'
}
```

---

### Correr el frontend local

```bash
# Opción 1: Python
python -m http.server 8080

# Opción 2: Node.js
npx serve .

# Opción 3: VS Code Live Server
# Click derecho en index.html → Open with Live Server
```

Abrir: http://localhost:8080

---

### Probar en Postman

1. Abrir `ride.html` → iniciar sesión → click **"Copy Auth Token"**
2. En Postman:
   - Method: `POST`
   - URL: `https://XXXXXXXX.execute-api.us-east-1.amazonaws.com/prod/ride`
   - Headers:
     - `Authorization`: pegar el JWT token copiado
     - `Content-Type`: `application/json`
   - Body (raw JSON):
```json
{
    "PickupLocation": {
        "Latitude": 19.4326,
        "Longitude": -99.1332
    }
}
```
3. Send → esperar respuesta 201 con datos del unicornio

---

## ⚠️ Notas importantes

- El frontend **no** se sube a Amplify, corre solo en local
- El módulo 1 (CodeCommit) **no** es necesario
- Módulos 2, 3 y 4 sí deben estar en AWS
- Recuerda hacer capturas de cada paso en AWS Console
- Al terminar, elimina los recursos para evitar cargos

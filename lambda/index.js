const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { randomBytes } = require("crypto");

const client = new DynamoDBClient({});

const fleet = [
    { Name: "Bucephalus",   Color: "Golden",  Gender: "Male"   },
    { Name: "Shadowfax",    Color: "White",   Gender: "Male"   },
    { Name: "Rocinante",    Color: "Yellow",  Gender: "Female" },
    { Name: "Celestia",     Color: "Silver",  Gender: "Female" },
    { Name: "Stardust",     Color: "Purple",  Gender: "Female" },
    { Name: "Thunderhoof",  Color: "Black",   Gender: "Male"   },
];

function toUrlString(buffer) {
    return buffer.toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

function errorResponse(errorMessage, awsRequestId, callback) {
    callback(null, {
        statusCode: 500,
        body: JSON.stringify({ Error: errorMessage, Reference: awsRequestId }),
        headers: {
            "Access-Control-Allow-Origin": "*",
        },
    });
}

function findUnicorn(pickupLocation) {
    console.log("Finding unicorn for ", pickupLocation.Latitude, ", ", pickupLocation.Longitude);
    return fleet[Math.floor(Math.random() * fleet.length)];
}

async function recordRide(rideId, username, unicorn) {
    const params = {
        TableName: "Rides",
        Item: {
            RideId:    { S: rideId },
            User:      { S: username },
            Unicorn:   { S: unicorn.Name },
            UnicornColor: { S: unicorn.Color },
            RequestTime: { S: new Date().toISOString() },
        },
    };
    return client.send(new PutItemCommand(params));
}

exports.handler = async function(event, context) {
    if (!event.requestContext.authorizer) {
        errorResponse("Authorization not configured", context.awsRequestId, () => {});
        return {
            statusCode: 401,
            body: JSON.stringify({ Error: "Unauthorized" }),
            headers: { "Access-Control-Allow-Origin": "*" },
        };
    }

    const rideId = toUrlString(randomBytes(16));
    console.log("Received event (", rideId, "): ", event);

    const username = event.requestContext.authorizer.claims["cognito:username"];
    const requestBody = JSON.parse(event.body);
    const pickupLocation = requestBody.PickupLocation;

    const unicorn = findUnicorn(pickupLocation);

    try {
        await recordRide(rideId, username, unicorn);
        return {
            statusCode: 201,
            body: JSON.stringify({
                RideId: rideId,
                Unicorn: unicorn,
                UnicornName: unicorn.Name,
                Eta: "30 seconds",
                Rider: username,
            }),
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
        };
    } catch (err) {
        console.error(err);
        return {
            statusCode: 500,
            body: JSON.stringify({ Error: err.message }),
            headers: { "Access-Control-Allow-Origin": "*" },
        };
    }
};

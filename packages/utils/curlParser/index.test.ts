import { RecipeAuthType, RecipeMethod } from "types/enums";
import { CurlRequestInfo, parseCurl } from ".";

function expectResultToEqual(
  result: CurlRequestInfo,
  expected: CurlRequestInfo
) {
  expect(result).toEqual<CurlRequestInfo>(expected);
}

// Our tests represent real cases from actual docs since I'm not really sure what all the edge cases are.

describe("OpenAI", () => {
  test("OpenAI", () => {
    const OPENAI_REQ = `
    curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '{
     "model": "gpt-3.5-turbo",
     "messages": [{"role": "user", "content": "Say this is a test!"}],
     "temperature": 0.7
   }'
   `;

    const result = parseCurl(OPENAI_REQ);

    expectResultToEqual(result, {
      method: RecipeMethod.POST,
      url: "https://api.openai.com/v1/chat/completions",
      headers: {
        Authorization: "Bearer $OPENAI_API_KEY",
        "Content-Type": "application/json",
      },
      body: {
        messages: [{ content: "Say this is a test!", role: "user" }],
        model: "gpt-3.5-turbo",
        temperature: 0.7,
      },
      authConfig: {
        payload: {
          default: "$OPENAI_API_KEY",
          name: "Authorization",
        },
        type: RecipeAuthType.Bearer,
      },
    });
  });
});

describe("Notion", () => {
  test("Notion GET", () => {
    const NOTION_REQ = `
    curl 'https://api.notion.com/v1/comments?block_id=5c6a28216bb14a7eb6e1c50111515c3d'\\
      -H 'Authorization: Bearer '"$NOTION_API_KEY"'' \
      -H "Notion-Version: 2022-06-28"
  
    `;

    expectResultToEqual(parseCurl(NOTION_REQ), {
      method: RecipeMethod.GET,
      url: "https://api.notion.com/v1/comments?block_id=5c6a28216bb14a7eb6e1c50111515c3d",
      headers: {
        Authorization: `Bearer '"$NOTION_API_KEY"'`,
        "Notion-Version": "2022-06-28",
      },
      body: null,
      authConfig: {
        payload: {
          default: `'"$NOTION_API_KEY"'`,
          name: "Authorization",
        },
        type: RecipeAuthType.Bearer,
      },
    });
  });

  test("Notion POST", () => {
    const NOTION_REQ = `
    curl -X POST 'https://api.notion.com/v1/search' \
  -H 'Authorization: Bearer '"$NOTION_API_KEY"'' \
  -H 'Content-Type: application/json' \
  -H 'Notion-Version: 2022-06-28' \
  --data '{
    "query":"External tasks",
    "filter": {
        "value": "database",
        "property": "object"
    },
    "sort":{
      "direction":"ascending",
      "timestamp":"last_edited_time"
    }
  }'
    `;

    expect(parseCurl(NOTION_REQ)).toEqual({
      method: "POST",
      url: "https://api.notion.com/v1/search",
      headers: {
        Authorization: `Bearer '"$NOTION_API_KEY"'`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: {
        query: "External tasks",
        filter: {
          value: "database",
          property: "object",
        },
        sort: {
          direction: "ascending",
          timestamp: "last_edited_time",
        },
      },
      authConfig: {
        payload: {
          default: `'"$NOTION_API_KEY"'`,
          name: "Authorization",
        },
        type: RecipeAuthType.Bearer,
      },
    });
  });
});

describe("More Use Cases", () => {
  test("BrainTree ", () => {
    const BRAIN_TREE_REQ = `
    curl  -H 'Authorization: Basic BASE64_ENCODED(PUBLIC_KEY:PRIVATE_KEY)'  -H 'Braintree-Version: 2019-01-01'  -H 'Content-Type: application/json'  -X POST https://payments.sandbox.braintree-api.com/graphql  -d '{"query": "query { ping }"}'
`;

    // TODO: Fix this when we implement basic
    expect(parseCurl(BRAIN_TREE_REQ)).toEqual({
      method: "POST",
      url: "https://payments.sandbox.braintree-api.com/graphql",
      headers: {
        Authorization: "Basic BASE64_ENCODED(PUBLIC_KEY:PRIVATE_KEY)",
        "Braintree-Version": "2019-01-01",
        "Content-Type": "application/json",
      },
      body: {
        query: "query { ping }",
      },
      authConfig: {
        type: RecipeAuthType.Basic,
        payload: {
          name: "base64",
          default: "BASE64_ENCODED(PUBLIC_KEY:PRIVATE_KEY)",
        },
      },
    });
  });

  test("COINBASE", () => {
    const COINBASE_REQ = `
    curl https://api.coinbase.com/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede \
    -H 'Authorization: Bearer abd90df5f27a7b170cd775abf89d632b350b7c1c9d53e08b340cd9832ce52c2c'
    `;

    expect(parseCurl(COINBASE_REQ)).toEqual({
      method: "GET",
      url: "https://api.coinbase.com/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede",
      headers: {
        Authorization:
          "Bearer abd90df5f27a7b170cd775abf89d632b350b7c1c9d53e08b340cd9832ce52c2c",
      },
      body: null,
      authConfig: {
        type: RecipeAuthType.Bearer,
        payload: {
          default:
            "abd90df5f27a7b170cd775abf89d632b350b7c1c9d53e08b340cd9832ce52c2c",
          name: "Authorization",
        },
      },
    });
  });

  test("CRUNCHBASE", () => {
    const CRUNCHBASE_REQ = `
      curl --request GET 'https://api.crunchbase.com/api/v4/entities/organizations/tesla-motors?card_ids=founders,raised_funding_rounds&field_ids=categories,short_description,rank_org_company,founded_on,website,facebook,created_at&user_key=INSERT_KEY_HERE'
      `;

    expect(parseCurl(CRUNCHBASE_REQ)).toEqual({
      method: "GET",
      url: "https://api.crunchbase.com/api/v4/entities/organizations/tesla-motors?card_ids=founders,raised_funding_rounds&field_ids=categories,short_description,rank_org_company,founded_on,website,facebook,created_at&user_key=INSERT_KEY_HERE",
      headers: {},
      body: null,
    });
  });

  test("Jira", () => {
    const JIRA_REQ = `
    curl -D- \
   -u fred@example.com:freds_api_token \
   -X GET \
   -H "Content-Type: application/json" \
   https://your-domain.atlassian.net/rest/api/2/issue/createmeta
    `;

    expectResultToEqual(parseCurl(JIRA_REQ), {
      url: "https://your-domain.atlassian.net/rest/api/2/issue/createmeta",
      method: RecipeMethod.GET,
      authConfig: {
        type: RecipeAuthType.Basic,
        payload: {
          name: "base64",
          default: btoa("fred@example.com:freds_api_token"),
        },
      },
      headers: {
        "Content-Type": "application/json",
      },
      body: null,
    });
  });

  describe("Google", () => {
    test("General", () => {
      const curlString = `curl -H "X-Goog-User-Project: your-project" -H "Authorization: Bearer $(gcloud auth print-access-token)" foo.googleapis.com`;
      expectResultToEqual(parseCurl(curlString), {
        body: null,
        headers: {
          Authorization: "Bearer $(gcloud auth print-access-token)",
          "X-Goog-User-Project": "your-project",
        },
        method: RecipeMethod.GET,
        url: "foo.googleapis.com",
        authConfig: {
          type: RecipeAuthType.Bearer,
          payload: {
            name: "Authorization",
            default: "$(gcloud auth print-access-token)",
          },
        },
      });
    });

    test("File inputted", () => {
      const curlString = `curl -X POST \
    -H "Authorization: Bearer $(gcloud auth print-access-token)" \
    -H "x-goog-user-project: PROJECT_NUMBER_OR_ID" \
    -H "Content-Type: application/json; charset=utf-8" \
    -d @request.json \
    "https://translation.googleapis.com/language/translate/v2"`;

      expectResultToEqual(parseCurl(curlString), {
        body: {
          "@request.json": null,
        },
        method: RecipeMethod.POST,
        url: "https://translation.googleapis.com/language/translate/v2",

        headers: {
          Authorization: "Bearer $(gcloud auth print-access-token)",
          "x-goog-user-project": "PROJECT_NUMBER_OR_ID",
          "Content-Type": "application/json; charset=utf-8",
        },
        authConfig: {
          type: RecipeAuthType.Bearer,
          payload: {
            name: "Authorization",
            default: "$(gcloud auth print-access-token)",
          },
        },
      });
    });

    test("Maps", () => {
      const curlString = `
      curl -X POST -d '{
          "origins": [
            {
              "waypoint": {
                "location": {
                  "latLng": {
                    "latitude": 37.420761,
                    "longitude": -122.081356
                  }
                }
              },
              "routeModifiers": { "avoid_ferries": true}
            },
            {
              "waypoint": {
                "location": {
                  "latLng": {
                    "latitude": 37.403184,
                    "longitude": -122.097371
                  }
                }
              },
              "routeModifiers": { "avoid_ferries": true}
            }
          ],
          "destinations": [
            {
              "waypoint": {
                "location": {
                  "latLng": {
                    "latitude": 37.420999,
                    "longitude": -122.086894
                  }
                }
              }
            },
            {
              "waypoint": {
                "location": {
                  "latLng": {
                    "latitude": 37.383047,
                    "longitude": -122.044651
                  }
                }
              }
            }
          ],
          "travelMode": "DRIVE",
          "routingPreference": "TRAFFIC_AWARE"
        }' \
        -H 'Content-Type: application/json' -H 'X-Goog-Api-Key: YOUR_API_KEY' \
        -H 'X-Goog-FieldMask: originIndex,destinationIndex,duration,distanceMeters,status,condition' \
        'https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix'
      `;

      expectResultToEqual(parseCurl(curlString), {
        body: {
          origins: [
            {
              waypoint: {
                location: {
                  latLng: {
                    latitude: 37.420761,
                    longitude: -122.081356,
                  },
                },
              },
              routeModifiers: { avoid_ferries: true },
            },
            {
              waypoint: {
                location: {
                  latLng: {
                    latitude: 37.403184,
                    longitude: -122.097371,
                  },
                },
              },
              routeModifiers: { avoid_ferries: true },
            },
          ],
          destinations: [
            {
              waypoint: {
                location: {
                  latLng: {
                    latitude: 37.420999,
                    longitude: -122.086894,
                  },
                },
              },
            },
            {
              waypoint: {
                location: {
                  latLng: {
                    latitude: 37.383047,
                    longitude: -122.044651,
                  },
                },
              },
            },
          ],
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
        },
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": "YOUR_API_KEY",
          "X-Goog-FieldMask":
            "originIndex,destinationIndex,duration,distanceMeters,status,condition",
        },
        method: RecipeMethod.POST,
        url: "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
      });
    });

    test("Youtube", () => {
      const curlString = `curl -X POST \
        -H "Authorization: Bearer <access_token>" \
        -H "Content-Type: multipart/form-data" \
        -F "part=snippet,status" \
        -F "snippet={"title": "My Playlist", "description": "A playlist created by me"}" \
        -F "status={"privacyStatus": "public"}" \
        https://www.googleapis.com/youtube/v3/playlists
      `;

      expectResultToEqual(parseCurl(curlString), {
        body: {
          part: "snippet,status",
          snippet: {
            title: "My Playlist",
            description: "A playlist created by me",
          },
          status: {
            privacyStatus: "public",
          },
        },
        method: RecipeMethod.POST,
        url: "https://www.googleapis.com/youtube/v3/playlists",

        headers: {
          Authorization: "Bearer <access_token>",
          "Content-Type": "multipart/form-data",
        },
        authConfig: {
          type: RecipeAuthType.Bearer,
          payload: {
            name: "Authorization",
            default: "<access_token>",
          },
        },
      });
    });
  });
});

describe("JSON is not valid", () => {
  test("Bad values because the docs wanted to describe the type of the key", () => {
    /*
    The traditional parsing function can't handle this because they values are not wrapped in quotes
    e.g "client_id": String -> "client_id": "String"

    Ideas for fixes:
      - Write our own parsing function (by forking and extending json5 library)
      - Some smart replace() regex that finds all values that are not wrapped in quotes and wraps them in quotes
    */

    const curlString = `
    curl -X POST https://sandbox.plaid.com/item/get \
      -H 'Content-Type: application/json' \
      -d '{
      "client_id": String,
      "secret": String,
      "access_token": String,
        "help": {
          "client_id": String,
        }
      }'
    `;

    expectResultToEqual(parseCurl(curlString), {
      method: RecipeMethod.POST,
      body: {
        client_id: "String",
        secret: "String",
        access_token: "String",
        help: {
          client_id: "String",
        },
      },
      headers: {
        "Content-Type": "application/json",
      },
      url: "https://sandbox.plaid.com/item/get",
    });
  });
});

describe("MailChimp", () => {
  test("MailChimp Form", () => {
    const MAILCHIMP_REQ = `
    curl -X POST \
    -H "Authorization: apikey <api_key>" \
    -H "Content-Type: multipart/form-data" \
    -F "type=regular" \
    -F "recipients={"list_id": "<list_id>"}" \
    -F "settings={"subject_line": "My Newsletter", "from_name": "Chimp", "reply_to": "chimp@example.com"}" \
    -F "content_type=template" \
    -F "template={"id": "<template_id>", "sections": {"body_content": "Hello, this is Chimp. I hope you enjoy this newsletter."}}" \
    https://<dc>.api.mailchimp.com/3.0/campaigns
   `;

    const result = parseCurl(MAILCHIMP_REQ);

    expectResultToEqual(result, {
      method: RecipeMethod.POST,
      url: "https://<dc>.api.mailchimp.com/3.0/campaigns",
      headers: {
        Authorization: "apikey <api_key>",
        "Content-Type": "multipart/form-data",
      },
      body: {
        type: "regular",
        recipients: {
          list_id: "<list_id>",
        },
        settings: {
          subject_line: "My Newsletter",
          from_name: "Chimp",
          reply_to: "chimp@example.com",
        },
        content_type: "template",
        template: {
          id: "<template_id>",
          sections: {
            body_content:
              "Hello, this is Chimp. I hope you enjoy this newsletter.",
          },
        },
      },
      authConfig: {
        payload: {
          default: "apikey <api_key>",
          name: "Authorization",
        },
        type: RecipeAuthType.Header,
      },
    });
  });
});

describe("slack", () => {
  test("slack form", () => {
    const curlString = `
    curl -X POST \
      -H "Content-Type: multipart/form-data" \
      --form "token=<YOUR_SLACK_TOKEN>" \
      --form "channel=<YOUR_CHANNEL_ID>" \
      --form "text=Hello, this is a message from curl" \
      https://slack.com/api/chat.postMessage    
    `;

    expectResultToEqual(parseCurl(curlString), {
      method: RecipeMethod.POST,
      url: "https://slack.com/api/chat.postMessage",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      body: {
        token: "<YOUR_SLACK_TOKEN>",
        channel: "<YOUR_CHANNEL_ID>",
        text: "Hello, this is a message from curl",
      },
    });
  });
});

describe.skip("Test cases to FIX", () => {
  test("Capture spaces in url without string", () => {
    const url =
      "https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude={part}&appid={API key}";

    const urlWithQuotes = `curl "${url}"`;
    expectResultToEqual(parseCurl(urlWithQuotes), {
      method: RecipeMethod.GET,
      headers: {},
      url: url,
      body: null,
    });

    const urlWithNoQuotes = `curl ${url}`;
    expectResultToEqual(parseCurl(urlWithNoQuotes), {
      method: RecipeMethod.GET,
      headers: {},
      url: url,
      body: null,
    });
  });
});

describe.skip("Not supported yet", () => {
  // test.skip("Lever API", () => {
  //   const LEVER_REQ = `
  //   curl --request POST \
  // --url 'https://auth.lever.co/oauth/token' \
  // --header 'content-type: application/x-www-form-urlencoded' \
  // --data 'grant_type=refresh_token&client_id=odduLmYKvgG5sHr6IO5KskcSpuGA2D&client_secret=uLmYKvgG5sHr6IO5KskcSpuGA2Dodd&refresh_token=DOOIm_5oZhqtkZmLwsFJudu4kBxSIdgMsKrxr_2QZZ9ia'
  //   `;
  //   // This won't work yet if form encoded
  //   expect(parseCurl(LEVER_REQ)).toEqual({
  //     method: "POST",
  //     url: "https://auth.lever.co/oauth/token",
  //     headers: {
  //       "content-type": "application/x-www-form-urlencoded",
  //     },
  //     body: {
  //       grant_type: "refresh_token",
  //     },
  //   });
  // });
  // This one a bit tough. Only Postman can handle for now
  // Content in the field below is a variable
  //   test.only("RESEND", () => {
  //     const RESEND_REQ = `
  //     curl -X POST 'https://api.resend.com/emails' \\
  //      -H 'Authorization: Bearer re_123456789' \\
  //      -H 'Content-Type: application/json' \\
  //      -d $'{
  //   "from": "Acme <onboarding@resend.dev>",
  //   "to": ["delivered@resend.dev"],
  //   "subject": "hello world",
  //   "text": "it works!",
  //   "headers": {
  //     "X-Entity-Ref-ID": "123"
  //   },
  //   "attachments": [
  //     {
  //       "filename": 'invoice.pdf',
  //       "content": invoiceBuffer,
  //     },
  //   ]
  // }'
  //     `;
  //     expect(parseCurl(RESEND_REQ)).toEqual({
  //       method: "POST",
  //       url: "https://api.resend.com/emails",
  //       headers: {
  //         Authorization: "Bearer re_123456789",
  //         "Content-Type": "application/json",
  //       },
  //       body: {
  //         from: "Acme <onboarding@resend.dev>",
  //         to: ["delivered@resend.dev"],
  //         subject: "hello world",
  //         text: "it works!",
  //         headers: {
  //           "X-Entity-Ref-ID": "123",
  //         },
  //         attachments: [
  //           {
  //             filename: "invoice.pdf",
  //             content: "invoiceBuffer",
  //           },
  //         ],
  //       },
  //     });
  //   });
  // TODO: Revisit the -U flag
  // test("STRIPE API", () => {
  //   const STRIPE_REQ = `
  //   curl https://api.stripe.com/v1/customers/cu_19YMK02eZvKYlo2CYWjsbgL3 \
  // -u sk_test_4eC39HqLyjWDarjtT1zdp7dc: \
  // -d "expand[]"=customer \
  // -d "expand[]"="invoice.subscription" \
  // -G
  // `;
  //   expect(parseCurl(STRIPE_REQ)).toEqual({
  //     method: "GET",
  //     url: "https://api.stripe.com/v1/customers/cu_19YMK02eZvKYlo2CYWjsbgL3",
  //     headers: {
  // })
});

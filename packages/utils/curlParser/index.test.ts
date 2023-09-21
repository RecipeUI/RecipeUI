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

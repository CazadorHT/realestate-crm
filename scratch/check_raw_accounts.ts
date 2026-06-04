const USER_TOKEN = "EAARjjRnZAnksBRkzlW8shBSPRrV7Qdc35889pJEKa40lUFIec7er2vi6Lu7tmZByUZBXIE2NTdULZARKQTazAV1u0OTh63BTJ6jN4NUQZCZBPj9sZBXRTkjeV05FrOBrtZCfZBZBzUKYsFzZBKoOnQWwSwA8AFPF8mGnwFvM7pldK9ZAELPzvK2xWOFsYazYQ8FzgzydW0VW4NrL9UfY";

async function main() {
  const pageId = "111608617234370";
  const url = `https://graph.facebook.com/v19.0/${pageId}?fields=access_token,name&access_token=${USER_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("Status Page Direct:", res.status);
  console.log("Response Page Direct:", JSON.stringify(data, null, 2));

  // Let's also check permissions of this specific token
  const permRes = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${USER_TOKEN}`);
  const permData = await permRes.json();
  console.log("Permissions Response:", JSON.stringify(permData, null, 2));
}

main().catch(console.error);

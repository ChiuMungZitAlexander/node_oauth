import * as dotenv from "dotenv";
import Koa, { type Context } from "koa";
import Router from "@koa/router";
import serve from "koa-static";
import path from "path";
import axios from "axios";

dotenv.config();

const app = new Koa();
const router = new Router();

const main = serve(path.join(__dirname + "/public"));

const oauth = async (ctx: Context) => {
  const requestToken = ctx.request.query.code;
  console.log("authorization code:", requestToken);

  const { CLIENT_ID, CLIENT_SECRET } = process.env;
  if (!CLIENT_ID || !CLIENT_SECRET)
    throw new Error("No client ID or secret provided");

  const tokenResponse = await axios({
    method: "post",
    url:
      "https://github.com/login/oauth/access_token?" +
      `client_id=${CLIENT_ID}&` +
      `client_secret=${CLIENT_SECRET}&` +
      `code=${requestToken}`,
    headers: {
      accept: "application/json",
    },
  });

  const accessToken = tokenResponse.data.access_token;
  console.log(`access token: ${accessToken}`);

  const result = await axios({
    method: "get",
    url: `https://api.github.com/user`,
    headers: {
      accept: "application/json",
      Authorization: `token ${accessToken}`,
    },
  });
  console.log(result.data);
  const name = result.data.name;

  ctx.response.redirect(`/welcome.html?name=${name}`);
};

router.get("/oauth/redirect", oauth);

app.use(main);
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(8080);

import cookie from "cookie";
import { useTranslation } from "react-i18next";
import type { LoaderFunction, MetaFunction } from "react-router";
import { data, redirect } from "react-router";
import { detectLocale, i18n } from "~/lib/i18n.server.ts";

export const loader = (async ({ request }) => {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/ja") || url.pathname.startsWith("/en")) {
    const newUrl = new URL(request.url);
    const language = url.pathname.slice(1, 3);
    newUrl.pathname = newUrl.pathname.replace(/^\/(ja|en)/, "");
    return redirect(newUrl.toString(), {
      status: 308,
      headers: {
        "set-cookie": cookie.serialize("locale", language, {
          path: "/",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365,
        }),
      },
    });
  }
  if (url.pathname.match(/levels\/chcy-([0-9a-zA-Z]+)/)) {
    const levelId = url.pathname.match(/levels\/chcy-([0-9a-zA-Z]+)/)![1];
    return redirect(`/charts/${levelId}`, { status: 308 });
  }

  const locale = await detectLocale(request);
  const rootT = await i18n.getFixedT(locale, "root");
  const t = await i18n.getFixedT(locale, "notFound");

  const title = `${t("title")} | ${rootT("name")}`;

  return data({ locale, title }, { status: 404 });
}) satisfies LoaderFunction;

export const handle = {
  i18n: "notFound",
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) {
    return [];
  }
  return [
    {
      title: data.title,
    },
  ];
};

export default function NotFound() {
  const { t } = useTranslation("notFound");
  return (
    <div>
      <h1 className="page-title">{t("heading")}</h1>
      <p>{t("description")}</p>
    </div>
  );
}

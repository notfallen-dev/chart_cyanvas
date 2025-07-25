import {
  EyeOffRegular,
  EyeRegular,
  MusicNote2Regular,
  OpenRegular,
} from "@fluentui/react-icons";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { pathcat } from "pathcat";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import ChartSection from "~/components/ChartSection";
import SonolusAvatar from "~/components/SonolusAvatar";
import { backendUrl, host } from "~/lib/config.server.ts";
import { useSession } from "~/lib/contexts.ts";
import { detectLocale, i18n } from "~/lib/i18n.server.ts";
import type { Chart, DiscordInfo, User } from "~/lib/types.ts";
import { isAdmin } from "~/lib/utils.ts";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const locale = await detectLocale(request);
  const rootT = await i18n.getFixedT(locale, "root");

  const userData = await fetch(
    pathcat(backendUrl, "/api/users/:handle", {
      handle: params.handle,
    }),
    {
      method: "GET",
    },
  ).then(async (res) => {
    const json = await res.json();

    if (json.code === "ok") {
      return json.user as User;
    } else {
      return null;
    }
  });

  if (!userData) {
    throw new Response(null, {
      status: 404,
    });
  }

  const userCharts = fetch(
    pathcat(backendUrl, "/api/charts", {
      authorHandles: userData.handle,
    }),
    {
      method: "GET",
    },
  ).then(async (res) => {
    const json = await res.json();

    if (json.code === "ok") {
      return json.charts as Chart[];
    } else {
      return [];
    }
  });

  const title = `${userData.name}#${userData.handle} | ${rootT("name")}`;

  return {
    userData,
    userCharts,
    title,
    host,
  };
};

export const handle = {
  i18n: "user",
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: data!.title,
    },
  ];
};

const UserPage = () => {
  const { t: rootT } = useTranslation("root");
  const { t } = useTranslation("user");
  const { userData, userCharts } = useLoaderData<typeof loader>();

  const session = useSession();

  const [secretUserInfo, setSecretUserInfo] = useState<{
    discord: DiscordInfo;
    warnCount: number;
    owner: User | null;
  } | null>(null);
  const [showSecretUserInfo, setShowSecretUserInfo] = useState(false);

  useEffect(() => {
    if (!isAdmin(session)) {
      return;
    }
    (async () => {
      console.log("fetching admin info");
      const res = await fetch(
        pathcat("/api/admin/users/:handle", {
          handle: userData.handle,
        }),
      );
      const data = await res.json();

      if (data.code === "ok") {
        setSecretUserInfo(data.user);
      }
    })();
  }, [session, userData]);

  return (
    <>
      <div className="flex flex-col">
        <div className="min-h-[300px] w-full flex relative">
          <div className="flex flex-col flex-grow">
            <h1 className="page-title-larger">
              {userData.name}
              <span className="text-xl">#{userData.handle}</span>
            </h1>

            <p className="text-lg mt-4">
              <MusicNote2Regular className="mr-1 w-6 h-6" />
              {t("totalCharts", { count: userData.chartCount })}
            </p>

            {secretUserInfo && (
              <div className="text-md mt-4 card flex flex-col">
                <button
                  onClick={() => setShowSecretUserInfo(!showSecretUserInfo)}
                  className="font-bold text-left"
                >
                  {showSecretUserInfo ? (
                    <EyeOffRegular className="mr-1 w-6 h-6" />
                  ) : (
                    <EyeRegular className="mr-1 w-6 h-6" />
                  )}
                  {t("showSecret")}
                </button>
                {showSecretUserInfo && (
                  <p>
                    <Trans t={t} i18nKey="secretUserInfo">
                      {secretUserInfo.owner ? (
                        <Link to={`/users/${secretUserInfo.owner.handle}`} />
                      ) : (
                        <span />
                      )}
                      {{
                        discord: secretUserInfo.discord.username,
                        warn: secretUserInfo.warnCount,
                        owner: secretUserInfo.owner
                          ? `${secretUserInfo.owner.name}#${secretUserInfo.owner.handle}`
                          : "-",
                      }}
                    </Trans>
                  </p>
                )}
              </div>
            )}
            <p className="flex-grow mt-4 mr-4 whitespace-pre-wrap break-words w-full">
              {userData.aboutMe}
            </p>
          </div>

          <div className="flex flex-col ml-2">
            <div className="md:h-40 md:w-40 square w-32 h-32 drop-shadow-lg">
              <SonolusAvatar
                avatar={userData.avatar}
                containerClassName="square w-full h-full"
                innerClassName="w-1/2 h-1/2"
              />
            </div>
            <div className="flex flex-col w-32 md:w-40 mt-4 text-center gap-2">
              <a
                href={`https://open.sonolus.com/players/id/${userData.handle}`}
                target="_blank"
                className="button button-sonolus p-1 rounded"
              >
                <OpenRegular className="small-button-icon" />
                {rootT("openInSonolus")}
              </a>
            </div>
          </div>
        </div>
        <ChartSection
          key={userData?.name}
          sections={[
            {
              title: t("userCharts"),
              items: userCharts,
              listUrl: pathcat("/charts", {
                authorHandles: userData?.handle,
              }),
            },
          ]}
        />
      </div>
    </>
  );
};

export default UserPage;

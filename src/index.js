const EXCHANGE_HOSTNAME = process.env.EXCHANGE_HOSTNAME;
const FEEDER_HOSTNAME = process.env.FEEDER_HOSTNAME;
const PLAY_HOSTNAME = process.env.PLAY_HOSTNAME;

export const handler = async (event) => {
  console.log(JSON.stringify({ event: event }));

  const { path } = event.requestContext.http;

  if (path === "/") {
    return {
      statusCode: 301,
      headers: { location: "https://www.prx.org/" },
    };
  }

  if (path.startsWith("/stories/")) {
    const storyId = path.split("/")[2];

    if (storyId) {
      // Check if Feeder can find an episode for this story ID
      const feederUrl = `https://${FEEDER_HOSTNAME}/api/v1/comatose/stories/${storyId}`;
      const feederResp = await fetch(feederUrl);

      if (feederResp.status === 200) {
        const feederData = await feederResp.json();
        const episodeUrl = feederData.url;

        if (episodeUrl) {
          return {
            statusCode: 301,
            headers: { location: episodeUrl },
          };
        }
      }

      // If we couldn't find a suitable URL to redirect to from Feeder,
      // we'll assume that this is a piece in Exchange, and redirect
      // there instead
      const exchangeUrl = `https://${EXCHANGE_HOSTNAME}/pieces/${storyId}?m=false`;

      return {
        statusCode: 301,
        headers: { location: exchangeUrl },
      };
    }
  } else if (path.startsWith("/series/")) {
    const seriesId = path.split("/")[2];

    if (seriesId) {
      // Check if Feeder can find a podcast for this series ID
      const feederUrl = `https://${FEEDER_HOSTNAME}/api/v1/comatose/series/${seriesId}`;
      const feederResp = await fetch(feederUrl);

      if (feederResp.status === 200) {
        const feederData = await feederResp.json();
        const feedUrl = feederData.url;

        // Redirect to a Play listen page for the podcast's feed
        if (feedUrl) {
          const encFeedUrl = encodeURIComponent(feedUrl);
          const playUrl = `https://${PLAY_HOSTNAME}/listen?uf=${encFeedUrl}`;
          return {
            statusCode: 301,
            headers: { location: playUrl },
          };
        }
      }

      // If we couldn't find a suitable URL to redirect to from Feeder,
      // we'll assume that this is a series in Exchange, and redirect
      // there instead
      const exchangeUrl = `https://${EXCHANGE_HOSTNAME}/series/${seriesId}?m=false`;

      return {
        statusCode: 301,
        headers: { location: exchangeUrl },
      };
    }
  } else if (path.startsWith("/accounts/")) {
    // Don't really know what to do with these at the moment
  }

  // If we get here, we couldn't find anything good to do with the
  // request, so we'll call it a 404
  return { statusCode: 404 };
};


export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      return Response.json(
        {
          error: "API endpoint is not connected",
          endpoint: url.pathname
        },
        { status: 501 }
      );
    }

    return env.ASSETS.fetch(request);
  }
};

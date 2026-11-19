export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API routing must be handled here if your backend API is active.
    // Do not route API requests to the frontend assets.

    return env.ASSETS.fetch(request);
  }
};

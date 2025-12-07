import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("effect/:effectId", "routes/effect.$effectId.tsx"),
] satisfies RouteConfig;

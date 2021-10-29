import log from "pino";
import dayjs from "dayjs";

export default log({
  prettyPrint: true,
  base: {
    pid: false,
  },
  timestamp: () => `,"time":"${dayjs().format()}"`,
});

export class LoggerService {
  constructor(core) {
    this.core = core;
  }

  info(message) {
    this.core.info(message);
  }

  warning(message) {
    this.core.warning(message);
  }

  error(message) {
    this.core.error(message);
  }
}

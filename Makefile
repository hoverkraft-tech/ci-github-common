.PHONY: help

help: ## Display help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

lint: ## Execute linting (https://github.com/github/super-linter)
	LINT_PATH="$(or $(shell readlink -f $(filter-out $@,$(MAKECMDGOALS))),$(CURDIR))"; \
	VOLUME="$$LINT_PATH:/tmp/lint/$(filter-out $@,$(MAKECMDGOALS))"; \
	docker run \
		-e RUN_LOCAL=true -e USE_FIND_ALGORITHM=true -e LOG_LEVEL=WARN -e LOG_FILE="../logs" \
		-v $$VOLUME \
		--rm \
		github/super-linter:slim-v4

#############################
# Argument fix workaround
#############################
%:
	@:
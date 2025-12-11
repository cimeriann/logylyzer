BINARY_NAME=logylyzer-agent
BUILD_DIR=build

.PHONY: build clean install

build:
	mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 .
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-amd64 .
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -o $(BUILD_DIR)/$(BINARY_NAME)-windows-amd64.exe .

clean:
	rm -rf $(BUILD_DIR)

install: build
	sudo cp $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 /opt/logylyzer/$(BINARY_NAME)
	sudo chmod +x /opt/logylyzer/$(BINARY_NAME)

test-local:
	go run . --config config.yaml
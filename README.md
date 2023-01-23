# SOAP Service Mock

> :wrench: &nbsp; **UNDER CONSTRUCTION**

The objective of this NodeJS script is to dynamically build a mock-server exposing a SOAP
service described by an input WSDL.

## Usage

The script expects a WSDL document as input, and can be triggered directly, or containerized and executed.

### Direct invocation

The direct invocation works just like for any other Node script i.e.

```bash
node index.js --wsdl <path to WSDL document>
```

e.g.

```bash
node index.js --wsdl /usr/temp/myService.wsdl
```

### Run as container

It is possible to build this project into a Docker image through the [Dockerfile](./Dockerfile) provided.
When doing so, it will be possible to pass the `server_port` argument through the `--build-arg` option: that's
the port at which the SOAP service will be exposed.

**Example:**

```bash
docker build -t node-wsdl-mock-server:0.0.1 --network=host -f ./Dockerfile --build-arg server_port=8005 .
```

The application can then be executed as a container. A volume will have to be set up in order to provide
the WSDL file (in the example below the WSDL file is kept in the `~/my/local/dir/wsdl` local directory,
which is configured as a volume to the `$HOME/vwsdl` path). **It is crucial that the volume path and the value of the `WSDL_FILEPATH` environment varibale are consistent** i.e. the `WSDL_FILEPATH` variable mist point to a file
within the path of the volume. In the example below, such consistency is granted through the use of a variable.

```bash
WSDL_DIR=:$HOME/vwsdl

docker run --rm -it --name soap-mock --network=host \
-v ~/my/local/dir/wsdl:$WSDL_DIR \
-e WSDL_FILEPATH=$WSDL_DIR/MyService.wsdl \
node-wsdl-mock-server:0.0.1
```

### Environment variables

The script reads environment variables for the following values:

| Variable                                | Purpose                                                    | Default  |
| --------------------------------------- | ---------------------------------------------------------- | -------- |
| `AVG_RESPONSE_TIME_MS`                  | Average wait time (ms) the service waits before responding | `1500`   |
| `RESPONSE_TIME_PERC_VARIATION`          | Percentage variation around the specified wait time        | `0.15`   |
| `SERVER_PORT`                           | Port at which the service is exposed                       | `8001`   |
| `WSDL_FILEPATH`                         | Path to the WSDL file describing the service to be mocked  | `TBD`    |
| `MESSAGE_SIZE_LIMIT`                    | Size limit for SOAP messages handled by the mock-server    | `5mb`    |

## Known limitations

- does not support XSD files
- completely ignores restrictions
- does not support all WSDL attributes (e.g. `<complexContent/>`)

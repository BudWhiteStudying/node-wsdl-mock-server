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

This doesn't quite work yet, but I guess I'll advise to link a volume to the deployment, so we can one day suport XSD files as well, as long as they can be found in the same volume.

### Environment variables

The script reads environment variables for the following values:

| Variable                                | Purpose                                                    | Default |
| --------------------------------------- | ---------------------------------------------------------- | ------- |
| `AVG_RESPONSE_TIME_MS`                  | Average wait time (ms) the service waits before responding | `1500`   |
| `RESPONSE_TIME_PERC_VARIATION`          | Percentage variation around the specified wait time        | `0.15`   |
| `SERVER_PORT`                           | Port at which the service is exposed                       | `8001`   |
| `WSDL_FILEPATH`                         | Path to the WSDL file describing the service to be mocked  | `TBD`    |
| `MESSAGE_SIZE_LIMIT`                    | Size limit for SOAP messages handled by the mock-server    | `5mb`    |

## Known limitations

- does not support XSD files
- completely ignores restrictions

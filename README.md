# pyCryptoTraderMsgr

Facebook messenger client for pyCryptoTrader.

# Requirement

- Docker 18.03.1-ce
- Docker-compose 1.19.0

# Usage

``` sh
./script/remote_deploy_docker_stack.sh [user]@[host] [stack name] [options]
```

- avaiable stack name: `msgr`
- available options:
  - `--follow` | `-f`: follow docker service log after deployed
  - `--pull`: pull image from docker registry instead of build on server

# Required Directoy Configuration

In order to excute properly, following non-commited directory / files configuration is stricyly required.

```
├── log       <= permission must set to 777
│   └── msgr  <= permission must set to 777
└── proj_root
    └── private
        ├── account.json
        ├── docker-reghub-0065a93a0ed4.json
        └── ssl
            ├── fullchain.pem
            └── privkey.pem
```
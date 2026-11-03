ARG IMAGE
FROM ${IMAGE}
USER root
# The image's ca-certificates predates Debian's fix for the eMudhra roots.
RUN apt-get update && apt-get install -y --no-install-recommends --only-upgrade ca-certificates && rm -rf /var/lib/apt/lists/* \
 && ! grep -q MIICTjCCAdOgAwIBAgIKPPYHqWhwDtqLhDAKBggqhkjOPQQDAzBr /etc/ssl/certs/ca-certificates.crt
USER 65534:65534

const deprecatedSslMode = /([?&]sslmode=)(prefer|require|verify-ca)\b/i;

export function pgConnectionString(connectionString: string) {
  return connectionString.replace(deprecatedSslMode, "$1verify-full");
}

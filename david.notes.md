# David's notes

### Notable files
- `$working_directory/MPCAutofill/MPCAutofill/.env`: Configuration values
- `$working_directory/MPCAutofill/client_secrets.json`: Google service account
- `$working_directory/MPCAutofill/drives.csv`: Google Drives containing proxy art

### VM setup

## Configuration
- e2-medium
- debian-11-bullseye-v20221206 image
- 100GB disk space
- HTTP/HTTPS traffic allowed
- us-central1-a

## Software
- git
- emacs
- tmux
- docker
- python3
- nginx
- certbot
- python3-certbot-nginx

## Instructions
- Spin up VM with above-mentioned configuration
- Install all above-mentioned necessary software
- Clone https://github.com/davidianstyle/mpc-autofill.git
- Checkout `purple` branch `git checkout purple`
- Make sure `MPCAutofill/MPCAutofill/.env` file contains ALLOWED_HOSTS and CSRF_TRUSTED_ORIGINS with values that match the URL from where the server will be served
- Go into `docker` directory
- Run `docker compose up --build` (server should be served on port 8000)
- Confirm server is up `curl localhost:8000` and see response
- Configure nginx reverse proxy (https://www.nginx.com/blog/using-free-ssltls-certificates-from-lets-encrypt-with-nginx/) in new nginx conf file `/etc/nginx/conf.d/mpc.dstylz.com.conf`
```
server {
    root /var/www/html;
    server_name mpc.dstylz.com;
}
```
- Reload nginx `nginx -t && nginx -s reload` (may need to remove default configuration from `/etc/nginx/sites-enabled/default` to avoid port 80 conflict)
- Configure SSL with certbot `sudo certbot --nginx -d mpc.dstylz.com`
- Confirm certbot made updates to nginx conf file `/etc/nginx/conf.d/mpc.dstylz.com.conf`
```
server {
    root /var/www/html;
    server_name mpc.dstylz.com;
    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/mpc.dstylz.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/mpc.dstylz.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}
server {
    if ($host = mpc.dstylz.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name mpc.dstylz.com;
    return 404; # managed by Certbot
}
```
- Install crontab to auto renew SSL `crontab -e`
```
0 12 * * * /usr/bin/certbot renew --quiet
```
- Add location redirect to locally running webapp
```
server {
    root /var/www/html;
    server_name mpc.dstylz.com;
    listen [::]:443 ssl ipv6only=on; # managed by Certbot
    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/mpc.dstylz.com/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/mpc.dstylz.com/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
    location / {
        proxy_pass http://localhost:8000/;
    }
}
server {
    if ($host = mpc.dstylz.com) {
        return 301 https://$host$request_uri;
    } # managed by Certbot
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name mpc.dstylz.com;
    return 404; # managed by Certbot
    location / {
        proxy_pass http://localhost:8000/;
    }
}
```
- Restart nginx `nginx -t && nginx -s reload`
- Navigate to URL to confirm site is up and running (mpc.dstylz.com)
- Install cronjob to update database
```
0 0 * * * bash /home/david_chang/mpc-autofill/update_database >> /home/david_chang/db_update.txt 2>&1
0 0 * * SUN bash /home/david_chang/mpc-autofill/sync_dfcs

# Base image: PHP 8.3 with Apache already wired together, no need to set up
# PHP-FPM and a separate web server for a project this size.
FROM php:8.3-apache

# The MySQL PDO driver is not enabled by default in this image. Without this,
# any PDO connection to MySQL fails with "could not find driver".
RUN docker-php-ext-install pdo pdo_mysql

# Apache serves from /var/www/html by default, but only the public folder
# should ever be reachable from a browser. This vhost file points the
# document root to public instead, so files like config/database.php stay
# outside anything a URL can reach, even though PHP can still read them
# straight off disk.
COPY apache-vhost.conf /etc/apache2/sites-available/000-default.conf

# Copies the project as it stands at build time. During development this
# gets overridden by the bind mount in docker-compose.yml, so it mostly
# matters if the image is ever built and run without that mount.
COPY . /var/www/html

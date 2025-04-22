FROM php:8.2-apache
#FROM php:7.3-apache

RUN apt-get update && apt-get install -y libpng-dev libjpeg-dev libfreetype6-dev libxpm-dev

# RUN docker-php-ext-configure gd --with-freetype-dir=/usr/include/freetype2 --with-jpeg-dir=/usr/include \
#     && docker-php-ext-install mysqli pdo pdo_mysql gd
RUN docker-php-ext-configure gd \
    && docker-php-ext-install mysqli pdo pdo_mysql gd


RUN apt-get update && apt-get install -y default-mysql-client

RUN apt-get update && \
    apt-get install -y cron

RUN a2enmod rewrite

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN apt-get update && apt-get install -y wget unzip \
    && wget https://files.phpmyadmin.net/phpMyAdmin/5.1.1/phpMyAdmin-5.1.1-all-languages.zip \
    && unzip phpMyAdmin-5.1.1-all-languages.zip -d /usr/share/ \
    && mv /usr/share/phpMyAdmin-5.1.1-all-languages /usr/share/phpmyadmin \
    && rm phpMyAdmin-5.1.1-all-languages.zip \
    && ln -s /usr/share/phpmyadmin /var/www/html/phpmyadmin

RUN echo "Alias /phpmyadmin /usr/share/phpmyadmin" >> /etc/apache2/conf-available/phpmyadmin.conf \
    && echo "<Directory /usr/share/phpmyadmin>" >> /etc/apache2/conf-available/phpmyadmin.conf \
    && echo "    Options FollowSymLinks" >> /etc/apache2/conf-available/phpmyadmin.conf \
    && echo "    DirectoryIndex index.php" >> /etc/apache2/conf-available/phpmyadmin.conf \
    && echo "    AllowOverride All" >> /etc/apache2/conf-available/phpmyadmin.conf \
    && echo "    Require all granted" >> /etc/apache2/conf-available/phpmyadmin.conf \
    && echo "</Directory>" >> /etc/apache2/conf-available/phpmyadmin.conf \
    && echo "<Directory /usr/share/phpmyadmin/setup>" >> /etc/apache2/conf-available/phpmyadmin.conf \
    && echo "    Require all granted" >> /etc/apache2/conf-available/phpmyadmin.conf \
    && echo "</Directory>" >> /etc/apache2/conf-available/phpmyadmin.conf \
    && a2enconf phpmyadmin

    
EXPOSE 80

COPY . /var/www/html/

# Criar o arquivo de crontab diretamente no container php vendor/bin/crunz schedule:run --source=/var/www/html/backend/console/Kernel.php
#RUN echo "* * * * * cd /var/www/html && php /var/www/html/vendor/bin/crunz schedule:run >> /var/log/crunz.log 2>&1" > /etc/cron.d/crunz
#RUN echo "* * * * * cd /var/www/html && /usr/local/bin/php /var/www/html/vendor/bin/crunz schedule:run --tasks=--tasks=Filazen\\Backend\\console\\Kernel" > /etc/cron.d/crunz && echo '' >> /etc/cron.d/crunz
RUN echo "* * * * * cd /var/www/html && /usr/local/bin/php /var/www/html/vendor/bin/crunz schedule:run /var/www/html/backend/tasks" > /etc/cron.d/crunz

# Garantir as permissões corretas para o arquivo de crontab
RUN chmod 0644 /etc/cron.d/crunz

# Adicionar o crontab
RUN crontab /etc/cron.d/crunz



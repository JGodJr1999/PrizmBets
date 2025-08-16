#!/bin/bash
# SSL Certificate Generation and Configuration Script for PrizmBets

set -e

DOMAIN=${1:-prizmbets.app}
SSL_DIR="/etc/ssl/prizmbets"
NGINX_SSL_DIR="/etc/nginx/ssl"

echo "Setting up SSL configuration for domain: $DOMAIN"

# Create SSL directories
sudo mkdir -p $SSL_DIR
sudo mkdir -p $NGINX_SSL_DIR

# Function to generate self-signed certificates for development/testing
generate_self_signed() {
    echo "Generating self-signed certificate for development..."
    
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $SSL_DIR/private.key \
        -out $SSL_DIR/certificate.crt \
        -subj "/C=US/ST=State/L=City/O=PrizmBets/CN=$DOMAIN" \
        -config <(
        echo '[dn]'
        echo 'CN='$DOMAIN
        echo '[req]'
        echo 'distinguished_name = dn'
        echo '[extensions]'
        echo 'subjectAltName=DNS:'$DOMAIN',DNS:*.'$DOMAIN',DNS:localhost'
        echo 'keyUsage=keyEncipherment,dataEncipherment'
        echo 'extendedKeyUsage=serverAuth'
        ) -extensions extensions
        
    echo "Self-signed certificate generated successfully"
}

# Function to setup Let's Encrypt certificates
setup_letsencrypt() {
    echo "Setting up Let's Encrypt certificates..."
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    fi
    
    # Generate certificate using standalone mode
    sudo certbot certonly --standalone \
        --email admin@$DOMAIN \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN \
        -d api.$DOMAIN
        
    # Copy certificates to our directory
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/certificate.crt
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/private.key
    
    # Setup auto-renewal
    setup_auto_renewal
    
    echo "Let's Encrypt certificates configured successfully"
}

# Function to setup certificate auto-renewal
setup_auto_renewal() {
    echo "Setting up certificate auto-renewal..."
    
    # Create renewal script
    cat > /tmp/renew-ssl.sh << EOF
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/certificate.crt
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/private.key
systemctl reload nginx
docker-compose restart nginx 2>/dev/null || true
EOF
    
    sudo cp /tmp/renew-ssl.sh /usr/local/bin/renew-ssl.sh
    sudo chmod +x /usr/local/bin/renew-ssl.sh
    
    # Add cron job for auto-renewal
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/renew-ssl.sh") | crontab -
    
    echo "Auto-renewal configured"
}

# Generate Diffie-Hellman parameters for enhanced security
generate_dhparam() {
    echo "Generating Diffie-Hellman parameters..."
    sudo openssl dhparam -out $SSL_DIR/dhparam.pem 2048
    echo "DH parameters generated"
}

# Create nginx SSL configuration snippet
create_nginx_ssl_config() {
    cat > /tmp/ssl-params.conf << EOF
# SSL Configuration for PrizmBets
ssl_certificate $SSL_DIR/certificate.crt;
ssl_certificate_key $SSL_DIR/private.key;

# SSL Protocols and Ciphers
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA;
ssl_prefer_server_ciphers on;

# SSL Performance
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 5m;
ssl_session_tickets off;

# SSL Security
ssl_dhparam $SSL_DIR/dhparam.pem;
ssl_stapling on;
ssl_stapling_verify on;

# Security Headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# OCSP Stapling
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
EOF

    sudo cp /tmp/ssl-params.conf $NGINX_SSL_DIR/ssl-params.conf
    echo "Nginx SSL configuration created"
}

# Main execution
echo "SSL Setup Options:"
echo "1. Generate self-signed certificate (development)"
echo "2. Setup Let's Encrypt certificate (production)"
echo "3. Both (self-signed first, then Let's Encrypt)"

read -p "Choose option [1-3]: " choice

case $choice in
    1)
        generate_self_signed
        ;;
    2)
        setup_letsencrypt
        ;;
    3)
        generate_self_signed
        setup_letsencrypt
        ;;
    *)
        echo "Invalid option. Generating self-signed certificate..."
        generate_self_signed
        ;;
esac

# Always generate DH parameters and nginx config
generate_dhparam
create_nginx_ssl_config

# Set proper permissions
sudo chmod 600 $SSL_DIR/private.key
sudo chmod 644 $SSL_DIR/certificate.crt
sudo chmod 644 $SSL_DIR/dhparam.pem

echo "SSL configuration completed successfully!"
echo "Certificate location: $SSL_DIR/certificate.crt"
echo "Private key location: $SSL_DIR/private.key"
echo "Nginx SSL config: $NGINX_SSL_DIR/ssl-params.conf"

# Test SSL configuration
echo "Testing SSL configuration..."
sudo nginx -t 2>/dev/null && echo "Nginx configuration is valid" || echo "Please check nginx configuration"

echo "SSL setup complete!"
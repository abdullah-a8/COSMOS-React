web: sh -c "\
  uvicorn api.app.main:app --host 127.0.0.1 --port \$PORT & \
  nginx -c \$HOME/config/nginx.conf.erb -g 'daemon off;' \
"
import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 1000,
  duration: '30s',
};

export default function () {
  const randomProductId = Math.floor(Math.random() * 1000011);
  http.get(`http://localhost:8080/reviews/meta?product_id=${randomProductId}`);
  sleep(1);
}

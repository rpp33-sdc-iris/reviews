import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
};

export default function () {
  const randomProductId = Math.floor(Math.random() * 1000011);
  const payload = JSON.stringify({
    product_id: randomProductId,
    rating: 5,
    summary: 'test summary',
    body: 'test body',
    recommend: true,
    name: 'tester',
    email: 'tester@gmail.com',
    photos: [
      'url1',
      'url2',
    ],
    characteristics: {
      1: 5, 2: 5, 3: 5, 4: 5,
    },
  });

  http.post('http://localhost:8080/reviews/', payload);
  sleep(1);
}

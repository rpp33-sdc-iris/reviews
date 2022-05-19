import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '60s',
      preAllocatedVUs: 60,
      maxVUs: 600,
    },
  },
};

export default function () {
  const payload = JSON.stringify({
    product_id: 1,
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

  http.post('http://localhost:8080/reviews/', payload, { headers: { 'Content-Type': 'application/json' } });
  sleep(1);
}

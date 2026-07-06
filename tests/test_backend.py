import os
import sys
import unittest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app


class BackendFlowsTestCase(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()
        self.admin_token = None
        self.user_token = None

    def _login(self, username, password):
        response = self.client.post('/api/auth/login', json={
            'username': username,
            'password': password,
        })
        self.assertEqual(response.status_code, 200)
        return response.get_json()['token']

    def test_platforms_and_admin_solicitudes_endpoints(self):
        self.admin_token = self._login('admin', 'admin123')

        platforms_res = self.client.get('/api/admin/plataformas', headers={
            'Authorization': f'Bearer {self.admin_token}'
        })
        self.assertEqual(platforms_res.status_code, 200)
        self.assertIsInstance(platforms_res.get_json(), list)

        solicitudes_res = self.client.get('/api/admin/solicitudes', headers={
            'Authorization': f'Bearer {self.admin_token}'
        })
        self.assertEqual(solicitudes_res.status_code, 200)
        self.assertIsInstance(solicitudes_res.get_json(), list)

    def test_user_request_deducts_credits(self):
        self.admin_token = self._login('admin', 'admin123')
        username = f'tester-credits-{uuid.uuid4().hex[:8]}'

        create_user_res = self.client.post('/api/admin/users', json={
            'username': username,
            'password': 'secret123',
            'credits': 50
        }, headers={'Authorization': f'Bearer {self.admin_token}'})
        self.assertEqual(create_user_res.status_code, 201)

        self.user_token = self._login(username, 'secret123')

        platforms_res = self.client.get('/api/user/plataformas', headers={
            'Authorization': f'Bearer {self.user_token}'
        })
        self.assertEqual(platforms_res.status_code, 200)
        platforms = platforms_res.get_json()
        self.assertTrue(platforms)

        first_platform = platforms[0]['nombre']
        request_res = self.client.post('/api/user/solicitar-cuenta', json={
            'plataforma': first_platform,
            'email': 'tester@example.com',
            'password': 'abc123'
        }, headers={'Authorization': f'Bearer {self.user_token}'})
        self.assertEqual(request_res.status_code, 201)

        profile_res = self.client.get('/api/user/profile', headers={
            'Authorization': f'Bearer {self.user_token}'
        })
        self.assertEqual(profile_res.status_code, 200)
        self.assertEqual(profile_res.get_json()['credits'], 50 - platforms[0]['precio'])


if __name__ == '__main__':
    unittest.main()

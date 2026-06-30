import os
import sys
import unittest

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


if __name__ == '__main__':
    unittest.main()

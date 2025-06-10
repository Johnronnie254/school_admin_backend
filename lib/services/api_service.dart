import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/auth_response.dart';
import '../models/user.dart';

class ApiService {
  static const String baseUrl = 'https://educitebackend.co.ke/api';

  final Dio _dio;
  final FlutterSecureStorage _storage;

  ApiService()
    : _dio = Dio(
        BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        ),
      ),
      _storage = const FlutterSecureStorage() {
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add access token to requests
          final token = await getAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          // Handle token refresh on 401
          if (error.response?.statusCode == 401) {
            final refreshed = await _refreshToken();
            if (refreshed) {
              // Retry the original request
              final opts = error.requestOptions;
              final token = await getAccessToken();
              if (token != null) {
                opts.headers['Authorization'] = 'Bearer $token';
              }
              try {
                final response = await _dio.fetch(opts);
                handler.resolve(response);
                return;
              } catch (e) {
                // If retry fails, continue with original error
              }
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  // Authentication Methods
  Future<LoginResponse> login(String email, String password) async {
    try {
      final response = await _dio.post(
        '/auth/login/',
        data: LoginRequest(email: email, password: password).toJson(),
      );

      final loginResponse = LoginResponse.fromJson(response.data);

      // Store tokens securely
      await _storage.write(
        key: 'access_token',
        value: loginResponse.accessToken,
      );
      await _storage.write(
        key: 'refresh_token',
        value: loginResponse.refreshToken,
      );

      return loginResponse;
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout/');
    } catch (e) {
      // Continue with logout even if API call fails
    } finally {
      await _storage.deleteAll();
    }
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await getRefreshToken();
      if (refreshToken == null) return false;

      final response = await _dio.post(
        '/auth/refresh/',
        data: {'refresh_token': refreshToken},
      );

      final refreshResponse = RefreshTokenResponse.fromJson(response.data);
      await _storage.write(
        key: 'access_token',
        value: refreshResponse.accessToken,
      );

      return true;
    } catch (e) {
      await _storage.deleteAll();
      return false;
    }
  }

  // Token Management
  Future<String?> getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: 'refresh_token');
  }

  Future<bool> isLoggedIn() async {
    final token = await getAccessToken();
    return token != null;
  }

  // Teacher-specific API calls
  Future<List<Teacher>> getTeachers() async {
    try {
      final response = await _dio.get('/teachers/');
      return (response.data as List)
          .map((json) => Teacher.fromJson(json))
          .toList();
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  Future<Teacher> getTeacherProfile(String teacherId) async {
    try {
      final response = await _dio.get('/teachers/$teacherId/');
      return Teacher.fromJson(response.data);
    } on DioException catch (e) {
      throw _handleError(e);
    }
  }

  // Error handling
  String _handleError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timeout. Please check your internet connection.';
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final data = error.response?.data;

        if (statusCode == 400) {
          if (data is Map && data.containsKey('non_field_errors')) {
            return data['non_field_errors'][0];
          }
          return 'Invalid login credentials.';
        } else if (statusCode == 401) {
          return 'Invalid email or password.';
        } else if (statusCode == 403) {
          return 'Access denied. Please contact administrator.';
        } else if (statusCode == 500) {
          return 'Server error. Please try again later.';
        }
        return 'Login failed. Please try again.';
      case DioExceptionType.cancel:
        return 'Request was cancelled.';
      default:
        return 'Network error. Please check your connection.';
    }
  }
}

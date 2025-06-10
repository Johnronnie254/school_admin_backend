import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';

enum AuthStatus { unknown, authenticated, unauthenticated }

class AuthProvider with ChangeNotifier {
  final ApiService _apiService;

  AuthStatus _status = AuthStatus.unknown;
  User? _user;
  Teacher? _teacher;
  String? _errorMessage;
  bool _isLoading = false;

  AuthProvider(this._apiService) {
    _checkAuthStatus();
  }

  // Getters
  AuthStatus get status => _status;
  User? get user => _user;
  Teacher? get teacher => _teacher;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _isLoading;
  bool get isTeacher => _user?.isTeacher ?? false;

  // Check if user is already logged in
  Future<void> _checkAuthStatus() async {
    try {
      final isLoggedIn = await _apiService.isLoggedIn();
      if (isLoggedIn) {
        _status = AuthStatus.authenticated;
        // You might want to fetch user profile here
      } else {
        _status = AuthStatus.unauthenticated;
      }
    } catch (e) {
      _status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  // Login method
  Future<bool> login(String email, String password) async {
    _setLoading(true);
    _clearError();

    try {
      final loginResponse = await _apiService.login(email, password);

      // Check if user is a teacher
      if (!loginResponse.user.isTeacher) {
        throw 'Access denied. Teachers only.';
      }

      _user = loginResponse.user;
      _teacher = loginResponse.teacher;
      _status = AuthStatus.authenticated;

      _setLoading(false);
      notifyListeners();
      return true;
    } catch (e) {
      _setError(e.toString());
      _setLoading(false);
      return false;
    }
  }

  // Logout method
  Future<void> logout() async {
    _setLoading(true);

    try {
      await _apiService.logout();
    } catch (e) {
      // Log error but continue with logout
      debugPrint('Logout error: $e');
    } finally {
      _user = null;
      _teacher = null;
      _status = AuthStatus.unauthenticated;
      _setLoading(false);
      notifyListeners();
    }
  }

  // Load teacher profile
  Future<void> loadTeacherProfile() async {
    if (_user == null || !_user!.isTeacher) return;

    try {
      // If you have an endpoint to get teacher by user ID
      // _teacher = await _apiService.getTeacherProfile(_user!.id);
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading teacher profile: $e');
    }
  }

  // Helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _errorMessage = error;
    notifyListeners();
  }

  void _clearError() {
    _errorMessage = null;
  }

  void clearError() {
    _clearError();
    notifyListeners();
  }
}

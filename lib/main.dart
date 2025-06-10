import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/api_service.dart';
import 'providers/auth_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/splash_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // API Service
        Provider<ApiService>(create: (_) => ApiService()),

        // Auth Provider
        ChangeNotifierProxyProvider<ApiService, AuthProvider>(
          create:
              (context) =>
                  AuthProvider(Provider.of<ApiService>(context, listen: false)),
          update:
              (context, apiService, previous) =>
                  previous ?? AuthProvider(apiService),
        ),
      ],
      child: MaterialApp(
        title: 'EduCite Teacher Portal',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.blue,
          fontFamily: 'Roboto',
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF667eea)),
        ),
        home: const AuthWrapper(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/dashboard': (context) => const DashboardScreen(),
        },
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        switch (authProvider.status) {
          case AuthStatus.unknown:
            return const SplashScreen();
          case AuthStatus.authenticated:
            return const DashboardScreen();
          case AuthStatus.unauthenticated:
            return const LoginScreen();
        }
      },
    );
  }
}

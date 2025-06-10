import 'package:json_annotation/json_annotation.dart';
import 'user.dart';

part 'auth_response.g.dart';

@JsonSerializable()
class LoginResponse {
  @JsonKey(name: 'access_token')
  final String accessToken;
  @JsonKey(name: 'refresh_token')
  final String refreshToken;
  final User user;
  final Teacher? teacher; // If teacher data is included

  LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
    this.teacher,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) => 
      _$LoginResponseFromJson(json);
  Map<String, dynamic> toJson() => _$LoginResponseToJson(this);
}

@JsonSerializable()
class RefreshTokenResponse {
  @JsonKey(name: 'access_token')
  final String accessToken;

  RefreshTokenResponse({required this.accessToken});

  factory RefreshTokenResponse.fromJson(Map<String, dynamic> json) => 
      _$RefreshTokenResponseFromJson(json);
  Map<String, dynamic> toJson() => _$RefreshTokenResponseToJson(this);
}

@JsonSerializable()
class LoginRequest {
  final String email;
  final String password;

  LoginRequest({
    required this.email,
    required this.password,
  });

  factory LoginRequest.fromJson(Map<String, dynamic> json) => 
      _$LoginRequestFromJson(json);
  Map<String, dynamic> toJson() => _$LoginRequestToJson(this);
} 
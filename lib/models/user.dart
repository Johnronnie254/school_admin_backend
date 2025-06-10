import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String email;
  @JsonKey(name: 'first_name')
  final String firstName;
  @JsonKey(name: 'last_name')
  final String lastName;
  final String role;
  final School? school;

  User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.school,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);

  String get fullName => '$firstName $lastName';
  bool get isTeacher => role == 'teacher';
}

@JsonSerializable()
class School {
  final String id;
  final String name;
  final String address;
  @JsonKey(name: 'phone_number')
  final String phoneNumber;
  final String email;

  School({
    required this.id,
    required this.name,
    required this.address,
    required this.phoneNumber,
    required this.email,
  });

  factory School.fromJson(Map<String, dynamic> json) => _$SchoolFromJson(json);
  Map<String, dynamic> toJson() => _$SchoolToJson(this);
}

@JsonSerializable()
class Teacher {
  final String id;
  final String name;
  final String email;
  @JsonKey(name: 'phone_number')
  final String? phoneNumber;
  @JsonKey(name: 'profile_pic')
  final String? profilePic;
  @JsonKey(name: 'class_assigned')
  final String? classAssigned;
  final List<String> subjects;
  final School? school;

  Teacher({
    required this.id,
    required this.name,
    required this.email,
    this.phoneNumber,
    this.profilePic,
    this.classAssigned,
    this.subjects = const [],
    this.school,
  });

  factory Teacher.fromJson(Map<String, dynamic> json) => _$TeacherFromJson(json);
  Map<String, dynamic> toJson() => _$TeacherToJson(this);
} 
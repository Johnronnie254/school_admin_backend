from rest_framework import permissions
from .models import Role

class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.SUPERUSER

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.ADMIN

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.TEACHER

class IsParent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.PARENT

class IsAdminOrTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Role.ADMIN, Role.TEACHER]

class IsAdminOrTeacherOrParent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Role.ADMIN, Role.TEACHER, Role.PARENT]

class IsSuperUserOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in [Role.SUPERUSER, Role.ADMIN] 
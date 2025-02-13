from django.contrib import admin
from .models import User, Teacher, Student, Notification

admin.site.register(User)
admin.site.register(Teacher)
admin.site.register(Student)
admin.site.register(Notification)


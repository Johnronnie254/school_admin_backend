# Generated by Django 4.2.7 on 2025-03-03 10:41

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('admin_interface', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='notification',
            options={'ordering': ['-created_at']},
        ),
        migrations.AlterModelOptions(
            name='teacher',
            options={'ordering': ['name']},
        ),
        migrations.AlterField(
            model_name='teacher',
            name='phone_number',
            field=models.CharField(blank=True, error_messages={'invalid': "Phone number must be in format '07XXXXXXXX'"}, max_length=15, null=True, validators=[django.core.validators.RegexValidator(message="Phone number must be in format '07XXXXXXXX'", regex='^07\\d{8}$')]),
        ),
    ]

# Generated by Django 2.2.13 on 2020-08-24 13:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0022_merge_20200814_2045'),
    ]

    operations = [
        migrations.AddField(
            model_name='hqapikey',
            name='role_id',
            field=models.CharField(blank=True, default='', max_length=40),
        ),
    ]

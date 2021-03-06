# Generated by Django 2.2.13 on 2020-09-24 17:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounting', '0048_friendly_writeoff'),
    ]

    operations = [
        migrations.AlterField(
            model_name='defaultproductplan',
            name='edition',
            field=models.CharField(choices=[('Community', 'Community'), ('Standard', 'Standard'), ('Pro', 'Pro'), ('Advanced', 'Advanced'), ('Enterprise', 'Enterprise'), ('Paused', 'Paused'), ('Reseller', 'Reseller'), ('Managed Hosting', 'Managed Hosting')], default='Community', max_length=25),
        ),
        migrations.AlterField(
            model_name='softwareplan',
            name='edition',
            field=models.CharField(choices=[('Community', 'Community'), ('Standard', 'Standard'), ('Pro', 'Pro'), ('Advanced', 'Advanced'), ('Enterprise', 'Enterprise'), ('Paused', 'Paused'), ('Reseller', 'Reseller'), ('Managed Hosting', 'Managed Hosting')], default='Enterprise', max_length=25),
        ),
    ]

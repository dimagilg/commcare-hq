# Generated by Django 1.11.11 on 2018-04-01 00:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('smsbillables', '0017_deactivate_grapevine_instance_fee_criteria'),
    ]

    operations = [
        migrations.AlterField(
            model_name='smsbillable',
            name='date_sent',
            field=models.DateTimeField(db_index=True),
        ),
    ]
